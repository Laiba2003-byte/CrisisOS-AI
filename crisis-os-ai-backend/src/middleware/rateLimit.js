const requestCounts = new Map();
const defaultWindowMs = 60 * 1000; // 1 minute
const defaultMaxRequests = 100; // 100 requests per minute per IP

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || defaultWindowMs;
  const maxRequests = options.maxRequests || defaultMaxRequests;
  const message = options.message || "Too many requests. Please slow down.";

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const now = Date.now();

    let record = requestCounts.get(ip);

    if (!record || now - record.startTime > windowMs) {
      record = {
        count: 1,
        startTime: now
      };
      requestCounts.set(ip, record);
    } else {
      record.count += 1;
    }

    if (record.count > maxRequests) {
      res.status(429).json({
        error: {
          message
        }
      });
      return;
    }

    next();
  };
}

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: "API rate limit exceeded. Please wait a minute before making more requests."
});

export const intakeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: "Too many incident reports submitted from this IP. Please try again shortly."
});
