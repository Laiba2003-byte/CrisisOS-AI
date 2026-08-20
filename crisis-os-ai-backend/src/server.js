import "dotenv/config";
import cors from "cors";
import express from "express";
import incidentRoutes from "./routes/incidents.routes.js";
import resourceRoutes from "./routes/resources.routes.js";
import shelterRoutes from "./routes/shelters.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authMiddleware } from "./middleware/auth.js";
import { apiRateLimiter } from "./middleware/rateLimit.js";
import { sseHandler } from "./lib/events.js";

const app = express();
const port = process.env.PORT || 4000;
const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175"
];
const configuredOrigins = `${process.env.CLIENT_ORIGINS || ""},${process.env.CLIENT_ORIGIN || ""}`
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));
const isLocalDevOrigin = (origin) => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    }
  })
);
app.use(express.json());
app.use(apiRateLimiter);
app.use(authMiddleware);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "crisisos-api"
  });
});

app.get("/api/events", sseHandler);
app.use("/api/incidents", incidentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/shelters", shelterRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`CrisisOS API listening on port ${port}`);
});