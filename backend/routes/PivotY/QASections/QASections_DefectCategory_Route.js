import express from "express";

import {
  CreateDefectCategory,
  GetDefectCategories,
  GetSpecificDefectCategory,
  UpdateDefectCategory,
  DeleteDefectCategory
} from "../../../controller/PivotY/QASections/QASections_DefectCategory_Controller.js";
const router = express.Router();

/**
 * POST
 * Route: Creates a new defect category
 */
router.post("/api/qa-sections-defect-category", CreateDefectCategory);

/**
 * GET
 * Route: Retrieves all defect categories sorted by no
 */
router.get("/api/qa-sections-defect-category", GetDefectCategories);

/**
 * GET
 * Route: Retrieves a specific defect category by ID
 */
router.get("/api/qa-sections-defect-category/:id", GetSpecificDefectCategory);

/**
 * PUT
 * Route: Updates a specific defect category
 */
router.put("/api/qa-sections-defect-category/:id", UpdateDefectCategory);

/**
 * DELETE
 * Route: Deletes a specific defect category
 */
router.delete("/api/qa-sections-defect-category/:id", DeleteDefectCategory);

export default router;
