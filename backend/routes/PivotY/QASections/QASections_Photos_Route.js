import express from "express";

import {
  CreatePhotoSection,
  GetPhotoSections,
  GetSpecificPhotoSection,
  UpdatePhotoSection,
  DeletePhotoSection,
  AddPhotoSectionItem,
  DeletePhotoSectionItem
} from "../../../controller/PivotY/QASections/QASections_Photos_Controller.js";
const router = express.Router();

/**
 * POST
 * Route: Creates a new photo section
 */
router.post("/api/qa-sections-photos", CreatePhotoSection);

/**
 * GET
 * Route: Retrieves all photo sections sorted by sectionName
 */
router.get("/api/qa-sections-photos", GetPhotoSections);

/**
 * GET
 * Route: Retrieves a specific photo section by ID
 */
router.get("/api/qa-sections-photos/:id", GetSpecificPhotoSection);

/**
 * PUT
 * Route: Updates a specific photo section
 */
router.put("/api/qa-sections-photos/:id", UpdatePhotoSection);

/**
 * DELETE
 * Route: Deletes a specific photo section
 */
router.delete("/api/qa-sections-photos/:id", DeletePhotoSection);

/**
 * POST
 * Route: Adds a new item to an existing photo section
 */
router.post("/api/qa-sections-photos/:id/items", AddPhotoSectionItem);

/**
 * DELETE
 * Route: Deletes a specific item from a photo section
 */
router.delete(
  "/api/qa-sections-photos/:id/items/:itemNo",
  DeletePhotoSectionItem
);

export default router;
