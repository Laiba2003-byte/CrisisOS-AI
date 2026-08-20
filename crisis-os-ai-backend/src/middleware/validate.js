function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

export function validateCreateIncident(req, _res, next) {
  const rawText = req.body?.rawText;

  if (typeof rawText !== "string" || !rawText.trim()) {
    return next(createHttpError(400, "rawText is required and must be a non-empty string."));
  }

  if (rawText.length > 5000) {
    return next(createHttpError(400, "rawText cannot exceed 5000 characters."));
  }

  req.body.rawText = rawText.trim();
  next();
}

export function validateUpdateIncidentStatus(req, _res, next) {
  const allowedStatuses = new Set([
    "new",
    "needs_review",
    "assigned",
    "en_route",
    "on_scene",
    "resolved",
    "merged"
  ]);
  const status = req.body?.status;

  if (typeof status !== "string" || !allowedStatuses.has(status.trim().toLowerCase())) {
    return next(
      createHttpError(
        400,
        "status must be one of: new, needs_review, assigned, en_route, on_scene, resolved, merged."
      )
    );
  }

  req.body.status = status.trim().toLowerCase();
  next();
}

export function validateMergeDuplicate(req, _res, next) {
  const duplicateIncidentId = req.body?.duplicateIncidentId;

  if (typeof duplicateIncidentId !== "string" || !duplicateIncidentId.trim()) {
    return next(createHttpError(400, "duplicateIncidentId is required."));
  }

  req.body.duplicateIncidentId = duplicateIncidentId.trim();
  next();
}

export function validateResourceStatus(req, _res, next) {
  const allowedStatuses = new Set(["available", "busy", "offline"]);
  const status = req.body?.status;

  if (typeof status !== "string" || !allowedStatuses.has(status.trim().toLowerCase())) {
    return next(createHttpError(400, "status must be one of: available, busy, offline."));
  }

  req.body.status = status.trim().toLowerCase();
  next();
}

export function validateResourceTracking(req, _res, next) {
  const { lat, lng, status } = req.body || {};

  if (lat !== undefined) {
    const numLat = Number(lat);
    if (!Number.isFinite(numLat) || numLat < -90 || numLat > 90) {
      return next(createHttpError(400, "lat must be a valid number between -90 and 90."));
    }
    req.body.lat = numLat;
  }

  if (lng !== undefined) {
    const numLng = Number(lng);
    if (!Number.isFinite(numLng) || numLng < -180 || numLng > 180) {
      return next(createHttpError(400, "lng must be a valid number between -180 and 180."));
    }
    req.body.lng = numLng;
  }

  if (status !== undefined) {
    const allowedStatuses = new Set(["available", "busy", "offline"]);
    const normStatus = typeof status === "string" ? status.trim().toLowerCase() : "";
    if (!allowedStatuses.has(normStatus)) {
      return next(createHttpError(400, "status must be one of: available, busy, offline."));
    }
    req.body.status = normStatus;
  }

  if (req.body.lat === undefined && req.body.lng === undefined && !req.body.status) {
    return next(createHttpError(400, "At least one tracking field is required: lat, lng, or status."));
  }

  next();
}

export function validateShelterPayload(req, _res, next) {
  const { name, locationText, lat, lng, capacity, occupancy, status } = req.body || {};

  if (req.method === "POST") {
    if (typeof name !== "string" || !name.trim()) {
      return next(createHttpError(400, "Shelter name is required."));
    }
    if (typeof locationText !== "string" || !locationText.trim()) {
      return next(createHttpError(400, "Shelter locationText is required."));
    }
    if (lat === undefined || lng === undefined) {
      return next(createHttpError(400, "Shelter lat and lng coordinates are required."));
    }
    if (capacity === undefined) {
      return next(createHttpError(400, "Shelter capacity is required."));
    }
  }

  if (lat !== undefined) {
    const numLat = Number(lat);
    if (!Number.isFinite(numLat) || numLat < -90 || numLat > 90) {
      return next(createHttpError(400, "lat must be a valid number between -90 and 90."));
    }
    req.body.lat = numLat;
  }

  if (lng !== undefined) {
    const numLng = Number(lng);
    if (!Number.isFinite(numLng) || numLng < -180 || numLng > 180) {
      return next(createHttpError(400, "lng must be a valid number between -180 and 180."));
    }
    req.body.lng = numLng;
  }

  if (capacity !== undefined) {
    const numCap = Number(capacity);
    if (!Number.isFinite(numCap) || numCap < 0) {
      return next(createHttpError(400, "capacity must be a non-negative integer."));
    }
    req.body.capacity = Math.floor(numCap);
  }

  if (occupancy !== undefined) {
    const numOcc = Number(occupancy);
    if (!Number.isFinite(numOcc) || numOcc < 0) {
      return next(createHttpError(400, "occupancy must be a non-negative integer."));
    }
    req.body.occupancy = Math.floor(numOcc);
  }

  if (status !== undefined) {
    const allowedShelterStatuses = new Set(["active", "full", "closed"]);
    const normStatus = typeof status === "string" ? status.trim().toLowerCase() : "";
    if (!allowedShelterStatuses.has(normStatus)) {
      return next(createHttpError(400, "status must be one of: active, full, closed."));
    }
    req.body.status = normStatus;
  }

  next();
}
