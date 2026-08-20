function getExpectedApiKey() {
  return process.env.CRISISOS_API_KEY || process.env.API_KEY || "CRISISOS_DEV_KEY_2026";
}

export function authMiddleware(req, res, next) {
  // Allow OPTIONS requests for CORS preflight
  if (req.method === "OPTIONS") {
    return next();
  }

  // Allow public access to health check, report intake creation, and SSE stream
  if (
    req.path === "/health" ||
    (req.path === "/api/incidents" && req.method === "POST") ||
    req.path === "/api/events"
  ) {
    return next();
  }

  // Disable strict auth enforcement in dev unless explicitly turned on
  if (process.env.ENFORCE_AUTH !== "true" && process.env.NODE_ENV !== "production") {
    return next();
  }

  const apiKeyHeader = req.headers["x-api-key"];
  const authHeader = req.headers["authorization"];

  let token = apiKeyHeader;

  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  const expectedKey = getExpectedApiKey();

  if (!token || token !== expectedKey) {
    res.status(401).json({
      error: {
        message: "Unauthorized: Missing or invalid API key / token."
      }
    });
    return;
  }

  next();
}
