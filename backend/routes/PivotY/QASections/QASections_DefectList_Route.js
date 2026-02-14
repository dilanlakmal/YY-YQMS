import express from "express";

import {
  CreateDefect,
  GetDefects,
  GetSpecificDefect,
  UpdateDefect,
  DeleteDefect,
  BulkUpdateStatusByBuyer
} from "../../../controller/PivotY/QASections/QASections_DefectList_Controller.js";
const router = express.Router();

/**
 * POST
 * Route: Creates a new defect
 */
router.post("/api/qa-sections-defect-list", CreateDefect);

/**
 * GET
 * Route: Retrieves all defects sorted by code
 */
router.get("/api/qa-sections-defect-list", GetDefects);

/**
 * GET
 * Route: Retrieves a specific defect by ID
 */
router.get("/api/qa-sections-defect-list/:id", GetSpecificDefect);

/**
 * PUT
 * Route: Updates a specific defect
 */
router.put("/api/qa-sections-defect-list/:id", UpdateDefect);

/**
 * DELETE
 * Route: Deletes a specific defect
 */
router.delete("/api/qa-sections-defect-list/:id", DeleteDefect);

// ROUTE for bulk updating the statusByBuyer array for all defects
router.put(
  "/api/qa-sections-defect-list/bulk-update/status-by-buyer",
  BulkUpdateStatusByBuyer
);

export default router;
