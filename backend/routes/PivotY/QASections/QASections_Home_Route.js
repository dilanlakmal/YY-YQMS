import express from "express";

import {
  CreateQASectionitem,
  GetQASectionitems,
  GetSpecificQASectionitem,
  UpdateQASectionitem,
  DeleteQASectionitem
} from "../../../controller/PivotY/QASections/QASections_Home_Controller.js";
const router = express.Router();

/**
 * POST
 * Route: Creates a new QA section item
 */
router.post("/api/qa-sections-home", CreateQASectionitem);

/**
 * GET
 * Route: Retrieves all QA section items sorted by DisplayOrderNo
 */
router.get("/api/qa-sections-home", GetQASectionitems);

/**
 * GET
 * Route: Retrieves a specific QA section item by ID
 */
router.get("/api/qa-sections-home/:id", GetSpecificQASectionitem);

/**
 * PUT
 * Route: Updates a specific QA section item
 */
router.put("/api/qa-sections-home/:id", UpdateQASectionitem);

/**
 * DELETE
 * Route: Deletes a specific QA section item
 */
router.delete("/api/qa-sections-home/:id", DeleteQASectionitem);

export default router;
