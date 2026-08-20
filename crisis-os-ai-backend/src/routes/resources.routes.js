import { Router } from "express";
import {
  listResources,
  updateResourceStatus,
  updateResourceTracking
} from "../controllers/resources.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  validateResourceStatus,
  validateResourceTracking
} from "../middleware/validate.js";

const router = Router();

router.get("/", asyncHandler(listResources));
router.patch("/:id/status", validateResourceStatus, asyncHandler(updateResourceStatus));
router.patch("/:id/tracking", validateResourceTracking, asyncHandler(updateResourceTracking));

export default router;