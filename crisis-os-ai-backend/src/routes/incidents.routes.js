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

const router = Router();

router.post("/", asyncHandler(createIncident));
router.get("/", asyncHandler(listIncidents));
router.get("/:id/suggest-resource", asyncHandler(suggestResourceForIncident));
router.get("/:id", asyncHandler(getIncidentById));
router.patch("/:id/status", asyncHandler(updateIncidentStatus));
router.patch("/:id/merge", asyncHandler(mergeIncidentDuplicate));

export default router;