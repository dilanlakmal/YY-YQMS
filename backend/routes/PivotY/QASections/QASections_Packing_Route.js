// QASections_Packing_Route.js

import express from "express";

import {
  CreatePackingSection,
  GetPackingSections,
  GetSpecificPackingSection,
  UpdatePackingSection,
  DeletePackingSection,
  DeletePackingSectionItem,
  AddPackingSectionItem
} from "../../../controller/PivotY/QASections/QASections_Packing_Controller.js";
const router = express.Router();

/**
 * POST
 * Route: Creates a new packing section
 */
router.post("/api/qa-sections-packing", CreatePackingSection);

/**
 * GET
 * Route: Retrieves all packing sections sorted by sectionNo
 */
router.get("/api/qa-sections-packing", GetPackingSections);

/**
 * GET
 * Route: Retrieves a specific packing section by ID
 */
router.get("/api/qa-sections-packing/:id", GetSpecificPackingSection);

/**
 * PUT
 * Route: Updates a specific packing section
 */
router.put("/api/qa-sections-packing/:id", UpdatePackingSection);

/**
 * DELETE
 * Route: Deletes a specific packing section
 */
router.delete("/api/qa-sections-packing/:id", DeletePackingSection);

/**
 * POST
 * Route: Adds a new item to an existing packing section
 */
router.post("/api/qa-sections-packing/:id/items", AddPackingSectionItem);

/**
 * DELETE
 * Route: Deletes a specific item from a packing section
 */
router.delete(
  "/api/qa-sections-packing/:id/items/:itemNo",
  DeletePackingSectionItem
);

export default router;
