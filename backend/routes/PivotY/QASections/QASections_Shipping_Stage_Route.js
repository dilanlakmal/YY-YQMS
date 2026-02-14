import express from "express";

import {
  CreateShippingStage,
  GetShippingStages,
  GetSpecificShippingStage,
  UpdateShippingStage,
  DeleteShippingStage
} from "../../../controller/PivotY/QASections/QASections_Shipping_Stage_Controller.js";
const router = express.Router();

/**
 * POST
 * Route: Creates a new shipping stage
 */
router.post("/api/qa-sections-shipping-stage", CreateShippingStage);

/**
 * GET
 * Route: Retrieves all shipping stages sorted by no
 */
router.get("/api/qa-sections-shipping-stage", GetShippingStages);

/**
 * GET
 * Route: Retrieves a specific shipping stage by ID
 */
router.get("/api/qa-sections-shipping-stage/:id", GetSpecificShippingStage);

/**
 * PUT
 * Route: Updates a specific shipping stage
 */
router.put("/api/qa-sections-shipping-stage/:id", UpdateShippingStage);

/**
 * DELETE
 * Route: Deletes a specific shipping stage
 */
router.delete("/api/qa-sections-shipping-stage/:id", DeleteShippingStage);

export default router;
