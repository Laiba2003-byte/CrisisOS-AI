import { Router } from "express";
import {
  listResources,
  updateResourceStatus,
  updateResourceTracking
} from "../controllers/resources.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listResources));
router.patch("/:id/status", asyncHandler(updateResourceStatus));
router.patch("/:id/tracking", asyncHandler(updateResourceTracking));

export default router;