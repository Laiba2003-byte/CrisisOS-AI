import { getPrisma } from "../lib/prisma.js";
import { broadcastEvent } from "../lib/events.js";
import { analyzeIncidentText } from "../services/incidentAnalysis.service.js";
import { attachDuplicateSignals, findPossibleDuplicateIncidents } from "../services/duplicateIncident.service.js";
import { resolveIncidentLocation } from "../services/geocoding.service.js";
import { findNearestAvailableResource } from "../services/resourceSuggestion.service.js";

const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const allowedIncidentStatuses = new Set([
  "new",
  "needs_review",
  "assigned",
  "en_route",
  "on_scene",
  "resolved",
  "merged"
]);

const includeAssignedResource = {
  assignedResource: true
};

function getReviewConfidenceThreshold() {
  const threshold = Number(process.env.AI_CONFIDENCE_REVIEW_THRESHOLD || 0.5);
  return Number.isFinite(threshold) ? threshold : 0.5;
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function normalizeRawText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeOptionalId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getReviewReasons(analysis, resolvedLocation) {
  const reasons = [];

  if (analysis.source === "fallback") {
    reasons.push("ai_unavailable");
  }

  if (analysis.confidence < getReviewConfidenceThreshold()) {
    reasons.push("low_confidence");
  }

  if (!analysis.location_text) {
    reasons.push("missing_location");
  } else if (!resolvedLocation) {
    reasons.push("unresolved_location");
  }

  return reasons;
}

function sortBySeverityThenRecency(a, b) {
  const severityDifference =
    (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);

  if (severityDifference !== 0) {
    return severityDifference;
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

async function releaseAssignedResource(tx, incident) {
  if (!incident.assignedResourceId) {
    return;
  }

  await tx.resource.update({
    where: {
      id: incident.assignedResourceId
    },
    data: {
      status: "available"
    }
  });
}

async function getDispatchResource(tx, incident, assignedResourceId) {
  if (assignedResourceId) {
    const resource = await tx.resource.findUnique({
      where: {
        id: assignedResourceId
      }
    });

    if (!resource) {
      throw createHttpError(404, "Assigned resource not found.");
    }

    if (
      resource.status !== "available" &&
      resource.id !== incident.assignedResourceId
    ) {
      throw createHttpError(
        409,
        "Assigned resource must be available before dispatch."
      );
    }

    return resource;
  }

  if (typeof incident.lat !== "number" || typeof incident.lng !== "number") {
    throw createHttpError(
      422,
      "Incident location is not resolved. Manual review is required before dispatch."
    );
  }

  const suggestedResource = await findNearestAvailableResource(tx, incident);

  if (!suggestedResource) {
    throw createHttpError(404, "No available resource found for dispatch.");
  }

  return suggestedResource;
}

export async function createIncident(req, res) {
  const rawText = normalizeRawText(req.body?.rawText);

  if (!rawText) {
    throw createHttpError(400, "rawText is required.");
  }

  const analysis = await analyzeIncidentText(rawText);
  const resolvedLocation = await resolveIncidentLocation({
    locationText: analysis.location_text,
    rawText
  });
  const reviewReasons = getReviewReasons(analysis, resolvedLocation);
  const status = reviewReasons.length > 0 ? "needs_review" : "new";
  const prisma = getPrisma();
  const incident = await prisma.incident.create({
    data: {
      rawText,
      type: analysis.type,
      severity: analysis.severity,
      locationText: analysis.location_text,
      lat: resolvedLocation?.lat || null,
      lng: resolvedLocation?.lng || null,
      confidence: analysis.confidence,
      aiNotes: analysis.notes,
      status
    },
    include: includeAssignedResource
  });
  const suggestedResource =
    status === "new"
      ? await findNearestAvailableResource(prisma, incident)
      : null;
  const possibleDuplicates = await findPossibleDuplicateIncidents(prisma, incident);

  const payload = {
    ...incident,
    suggestedResource,
    possibleDuplicates,
    reviewReasons,
    locationResolution: resolvedLocation
      ? {
          source: resolvedLocation.source,
          confidence: resolvedLocation.confidence,
          name: resolvedLocation.name
        }
      : null
  };

  broadcastEvent("incident_created", payload);
  res.status(201).json(payload);
}

export async function listIncidents(_req, res) {
  const prisma = getPrisma();
  const incidents = await prisma.incident.findMany({
    include: includeAssignedResource,
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(attachDuplicateSignals(incidents.sort(sortBySeverityThenRecency)));
}

export async function getIncidentById(req, res) {
  const prisma = getPrisma();
  const incident = await prisma.incident.findUnique({
    where: {
      id: req.params.id
    },
    include: includeAssignedResource
  });

  if (!incident) {
    throw createHttpError(404, "Incident not found.");
  }

  const possibleDuplicates = await findPossibleDuplicateIncidents(prisma, incident);

  res.json({
    ...incident,
    possibleDuplicates
  });
}

export async function updateIncidentStatus(req, res) {
  const status = normalizeStatus(req.body?.status);
  const assignedResourceId = normalizeOptionalId(req.body?.assignedResourceId);

  if (!allowedIncidentStatuses.has(status)) {
    throw createHttpError(
      400,
      "status must be one of: new, needs_review, assigned, en_route, on_scene, resolved, merged."
    );
  }

  const prisma = getPrisma();

  const updatedIncident = await prisma.$transaction(async (tx) => {
    const currentIncident = await tx.incident.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!currentIncident) {
      throw createHttpError(404, "Incident not found.");
    }

    if (status === "assigned") {
      const resource = await getDispatchResource(
        tx,
        currentIncident,
        assignedResourceId
      );

      if (
        currentIncident.assignedResourceId &&
        currentIncident.assignedResourceId !== resource.id
      ) {
        await releaseAssignedResource(tx, currentIncident);
      }

      await tx.resource.update({
        where: {
          id: resource.id
        },
        data: {
          status: "busy"
        }
      });

      return tx.incident.update({
        where: {
          id: req.params.id
        },
        data: {
          status: "assigned",
          assignedResourceId: resource.id
        },
        include: includeAssignedResource
      });
    }

    if (["en_route", "on_scene"].includes(status)) {
      if (!currentIncident.assignedResourceId) {
        throw createHttpError(
          409,
          "Incident must be assigned before moving to en_route or on_scene."
        );
      }

      return tx.incident.update({
        where: {
          id: req.params.id
        },
        data: {
          status
        },
        include: includeAssignedResource
      });
    }

    if (status === "resolved") {
      await releaseAssignedResource(tx, currentIncident);

      return tx.incident.update({
        where: {
          id: req.params.id
        },
        data: {
          status: "resolved"
        },
        include: includeAssignedResource
      });
    }

    if (currentIncident.assignedResourceId) {
      await releaseAssignedResource(tx, currentIncident);
    }

    return tx.incident.update({
      where: {
        id: req.params.id
      },
      data: {
        status,
        assignedResourceId: null
      },
      include: includeAssignedResource
    });
  });

  broadcastEvent("incident_updated", updatedIncident);
  res.json(updatedIncident);
}

function appendIncidentNote(currentNotes, note) {
  return [currentNotes, note].filter(Boolean).join("\n");
}

function isActiveDispatchStatus(status) {
  return ["assigned", "en_route", "on_scene"].includes(status);
}

export async function mergeIncidentDuplicate(req, res) {
  const primaryIncidentId = req.params.id;
  const duplicateIncidentId = normalizeOptionalId(req.body?.duplicateIncidentId);

  if (!duplicateIncidentId) {
    throw createHttpError(400, "duplicateIncidentId is required.");
  }

  if (primaryIncidentId === duplicateIncidentId) {
    throw createHttpError(400, "An incident cannot be merged into itself.");
  }

  const prisma = getPrisma();

  const result = await prisma.$transaction(async (tx) => {
    const [primaryIncident, duplicateIncident] = await Promise.all([
      tx.incident.findUnique({
        where: {
          id: primaryIncidentId
        }
      }),
      tx.incident.findUnique({
        where: {
          id: duplicateIncidentId
        }
      })
    ]);

    if (!primaryIncident) {
      throw createHttpError(404, "Primary incident not found.");
    }

    if (!duplicateIncident) {
      throw createHttpError(404, "Duplicate incident not found.");
    }

    if (primaryIncident.status === "merged") {
      throw createHttpError(409, "Cannot merge into an incident that is already merged.");
    }

    if (duplicateIncident.status === "merged") {
      throw createHttpError(409, "Duplicate incident is already merged.");
    }

    const mergedAt = new Date().toISOString();
    const shouldTransferAssignedResource =
      !primaryIncident.assignedResourceId &&
      duplicateIncident.assignedResourceId &&
      isActiveDispatchStatus(duplicateIncident.status);

    if (
      duplicateIncident.assignedResourceId &&
      duplicateIncident.assignedResourceId !== primaryIncident.assignedResourceId &&
      !shouldTransferAssignedResource
    ) {
      await tx.resource.update({
        where: {
          id: duplicateIncident.assignedResourceId
        },
        data: {
          status: "available"
        }
      });
    }

    const primaryMergeNote = `Merged duplicate incident ${duplicateIncident.id} on ${mergedAt}. Duplicate report: ${duplicateIncident.rawText}`;
    const duplicateMergeNote = `Merged into incident ${primaryIncident.id} on ${mergedAt}.`;

    const updatedPrimaryIncident = await tx.incident.update({
      where: {
        id: primaryIncident.id
      },
      data: {
        aiNotes: appendIncidentNote(primaryIncident.aiNotes, primaryMergeNote),
        ...(shouldTransferAssignedResource
          ? {
              assignedResourceId: duplicateIncident.assignedResourceId,
              status: isActiveDispatchStatus(primaryIncident.status)
                ? primaryIncident.status
                : "assigned"
            }
          : {})
      },
      include: includeAssignedResource
    });

    const mergedIncident = await tx.incident.update({
      where: {
        id: duplicateIncident.id
      },
      data: {
        assignedResourceId: null,
        aiNotes: appendIncidentNote(duplicateIncident.aiNotes, duplicateMergeNote),
        status: "merged"
      },
      include: includeAssignedResource
    });

    const possibleDuplicates = await findPossibleDuplicateIncidents(
      tx,
      updatedPrimaryIncident
    );

    return {
      primaryIncident: {
        ...updatedPrimaryIncident,
        possibleDuplicates
      },
      mergedIncident
    };
  });

  broadcastEvent("incident_merged", result);
  res.json(result);
}
export async function suggestResourceForIncident(req, res) {
  const prisma = getPrisma();
  const incident = await prisma.incident.findUnique({
    where: {
      id: req.params.id
    }
  });

  if (!incident) {
    throw createHttpError(404, "Incident not found.");
  }

  if (typeof incident.lat !== "number" || typeof incident.lng !== "number") {
    throw createHttpError(
      422,
      "Incident location is not resolved. Manual review is required before resource suggestion."
    );
  }

  const suggestedResource = await findNearestAvailableResource(prisma, incident);

  if (!suggestedResource) {
    throw createHttpError(404, "No available resource found.");
  }

  res.json(suggestedResource);
}