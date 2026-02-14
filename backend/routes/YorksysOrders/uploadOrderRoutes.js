import express from "express";
import {
  saveYorksysOrderData,
  getYorksysOrderFilterOptions,
  getYorksysOrdersPagination,
  getYorksysOrder,
  updateYorksysOrderProductType,
  previewBulkUpdateProductType,
  bulkUpdateProductTypeFromCutting,
  updateYorksysOrderRibContent,
} from "../../controller//YorksysOrders/uploadOrderController.js";

const router = express.Router();

router.post("/api/yorksys-orders/save", saveYorksysOrderData);

// Route to get unique values for filter dropdowns
router.get("/api/yorksys-orders/filters", getYorksysOrderFilterOptions);

// Route to get all orders with pagination
router.get("/api/yorksys-orders", getYorksysOrdersPagination);

router.get("/api/yorksys-orders/:moNo", getYorksysOrder);

// ROUTE: To update the product type of a specific order by its ID
router.put(
  "/api/yorksys-orders/:id/product-type",
  updateYorksysOrderProductType,
);

// ROUTE: Preview how many Yorksys orders will be updated
router.post(
  "/api/yorksys-orders/bulk-update-preview",
  previewBulkUpdateProductType,
);

// ROUTE: Perform the bulk update of product types from cutting data
router.put(
  "/api/yorksys-orders/bulk-update-product-type",
  bulkUpdateProductTypeFromCutting,
);

// ROUTE: Update Rib Content specifically
router.put("/api/yorksys-orders/:id/rib-content", updateYorksysOrderRibContent);

export default router;
