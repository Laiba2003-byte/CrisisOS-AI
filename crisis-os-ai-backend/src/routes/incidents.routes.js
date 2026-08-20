import { Router } from "express";
import {
  createIncident,
  getIncidentById,
  listIncidents,
  mergeIncidentDuplicate,
  suggestResourceForIncident,
  updateIncidentStatus
} from "../controllers/incidents.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { intakeRateLimiter } from "../middleware/rateLimit.js";
import {
  validateCreateIncident,
  validateMergeDuplicate,
  validateUpdateIncidentStatus
} from "../middleware/validate.js";

const router = Router();

router.post("/", intakeRateLimiter, validateCreateIncident, asyncHandler(createIncident));
router.get("/", asyncHandler(listIncidents));
router.get("/:id/suggest-resource", asyncHandler(suggestResourceForIncident));
router.get("/:id", asyncHandler(getIncidentById));
router.patch("/:id/status", validateUpdateIncidentStatus, asyncHandler(updateIncidentStatus));
router.patch("/:id/merge", validateMergeDuplicate, asyncHandler(mergeIncidentDuplicate));

export default router;