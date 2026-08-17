import { getPrisma } from "../lib/prisma.js";

const allowedResourceStatuses = new Set(["available", "busy", "offline"]);

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeOptionalStatus(value) {
  const status = normalizeStatus(value);
  return status || null;
}

function normalizeCoordinate(value, label, min, max) {
  const coordinate = Number(value);

  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    throw createHttpError(400, `${label} must be a number between ${min} and ${max}.`);
  }

  return coordinate;
}

async function getResourceOrThrow(prisma, id) {
  const resource = await prisma.resource.findUnique({
    where: {
      id
    }
  });

  if (!resource) {
    throw createHttpError(404, "Resource not found.");
  }

  return resource;
}

export async function listResources(_req, res) {
  const prisma = getPrisma();
  const resources = await prisma.resource.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }]
  });

  res.json(resources);
}

export async function updateResourceStatus(req, res) {
  const status = normalizeStatus(req.body?.status);

  if (!allowedResourceStatuses.has(status)) {
    throw createHttpError(
      400,
      "status must be one of: available, busy, offline."
    );
  }

  const prisma = getPrisma();
  await getResourceOrThrow(prisma, req.params.id);

  const updatedResource = await prisma.resource.update({
    where: {
      id: req.params.id
    },
    data: {
      status
    }
  });

  res.json(updatedResource);
}

export async function updateResourceTracking(req, res) {
  const prisma = getPrisma();
  await getResourceOrThrow(prisma, req.params.id);

  const data = {};

  if (req.body?.lat !== undefined) {
    data.lat = normalizeCoordinate(req.body.lat, "lat", -90, 90);
  }

  if (req.body?.lng !== undefined) {
    data.lng = normalizeCoordinate(req.body.lng, "lng", -180, 180);
  }

  const status = normalizeOptionalStatus(req.body?.status);

  if (status) {
    if (!allowedResourceStatuses.has(status)) {
      throw createHttpError(
        400,
        "status must be one of: available, busy, offline."
      );
    }

    data.status = status;
  }

  if (!Object.keys(data).length) {
    throw createHttpError(400, "At least one tracking field is required: lat, lng, or status.");
  }

  const updatedResource = await prisma.resource.update({
    where: {
      id: req.params.id
    },
    data
  });

  res.json({
    ...updatedResource,
    trackingUpdatedAt: new Date().toISOString()
  });
}