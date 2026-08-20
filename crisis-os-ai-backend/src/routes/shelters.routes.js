import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateShelterPayload } from "../middleware/validate.js";
import {
  createShelter,
  getShelterById,
  listShelters,
  updateShelter
} from "../controllers/shelters.controller.js";

const router = Router();

router.get("/", asyncHandler(listShelters));
router.get("/:id", asyncHandler(getShelterById));
router.post("/", validateShelterPayload, asyncHandler(createShelter));
router.patch("/:id", validateShelterPayload, asyncHandler(updateShelter));

export default router;
