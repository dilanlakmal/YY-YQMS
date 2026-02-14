import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";
import {
  getInspectionOrderDetails,
  searchInspectionOrders,
  getMultipleOrderDetails,
  findRelatedOrders,
  getOrderColors,
  getAqlConfigByBuyer,
  getSubConFactories,
  getOrderProductTypeInfo,
  getProductTypeOptions,
  updateOrderProductType,
  createInspectionReport,
  getInspectionReportById,
  checkExistingReport,
  uploadHeaderImages,
  updateHeaderData,
  uploadPhotoBatch,
  deletePhotoFromItem,
  updatePhotoItemRemark,
  updatePhotoData,
  updateInspectionConfig,
  clearInspectionConfig,
  updateMeasurementData,
  uploadDefectImages,
  updateDefectData,
  uploadPPSheetImages,
  updatePPSheetData,
  submitFullInspectionReport,
  searchPreviousReports
} from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Controller.js";

const router = express.Router();

// Configure Multer

// Define Storage Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We save to a temporary folder first. The controller will move files to the final destination.
const tempUploadDir = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/temp_uploads"
);

// Ensure temp directory exists
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const upload = multer({
  dest: tempUploadDir,
  limits: { fileSize: 50 * 1024 * 1024 } // Optional: Limit to 50MB per file
});

// Search orders for inspection (supports mode: single, multi)
router.get("/api/fincheck-inspection/search-orders", searchInspectionOrders);

// Get single order details for inspection
router.get(
  "/api/fincheck-inspection/order-details/:moNo",
  getInspectionOrderDetails
);

// Get multiple order details (for Multi/Batch mode)
router.post(
  "/api/fincheck-inspection/multiple-order-details",
  getMultipleOrderDetails
);

// Find related orders by base order number
router.get("/api/fincheck-inspection/find-related-orders", findRelatedOrders);

// Get distinct colors for selected orders
router.post("/api/fincheck-inspection/order-colors", getOrderColors);

// Get AQL configuration by buyer
router.get("/api/fincheck-inspection/aql-config", getAqlConfigByBuyer);

// Get Sub-Con Factories
router.get("/api/fincheck-inspection/subcon-factories", getSubConFactories);

// Get Product Type Info for Orders
router.post(
  "/api/fincheck-inspection/order-product-type",
  getOrderProductTypeInfo
);

// Get All Product Type Options for Dropdown
router.get(
  "/api/fincheck-inspection/product-type-options",
  getProductTypeOptions
);

// Update Product Type for Orders
router.put(
  "/api/fincheck-inspection/update-product-type",
  updateOrderProductType
);

// Create Inspection Report
router.post("/api/fincheck-inspection/create-report", createInspectionReport);

// Get Inspection Report by ID
router.get(
  "/api/fincheck-inspection/report/:reportId",
  getInspectionReportById
);

// Check Existing Report
router.post(
  "/api/fincheck-inspection/check-existing-report",
  checkExistingReport
);

// Save Header Images (Multipart)
router.post(
  "/api/fincheck-inspection/upload-header-images",
  upload.array("images"),
  uploadHeaderImages
);

// Save Header Data
router.post("/api/fincheck-inspection/update-header-data", updateHeaderData);

// Batch Upload Photos (Incremental - per item)
router.post(
  "/api/fincheck-inspection/upload-photo-batch",
  upload.array("images"),
  uploadPhotoBatch
);

// Delete Single Photo
router.post("/api/fincheck-inspection/delete-photo", deletePhotoFromItem);

// Update Remark Only
router.post(
  "/api/fincheck-inspection/update-photo-remark",
  updatePhotoItemRemark
);

// Save Photo Data
router.post("/api/fincheck-inspection/update-photo-data", updatePhotoData);

// Save Inspection Config (Info Tab)
router.post(
  "/api/fincheck-inspection/update-inspection-config",
  updateInspectionConfig
);

// Clear Inspection Config (Remove All)
router.post(
  "/api/fincheck-inspection/clear-inspection-config",
  clearInspectionConfig
);

// Save Measurement Data (Measurement Tab)
router.post(
  "/api/fincheck-inspection/update-measurement-data",
  updateMeasurementData
);

// Save Defect Images
router.post(
  "/api/fincheck-inspection/upload-defect-images",
  upload.array("images"),
  uploadDefectImages
);

// Save Defect Data
router.post("/api/fincheck-inspection/update-defect-data", updateDefectData);

// Upload PP Sheet Images (Multipart)
router.post(
  "/api/fincheck-inspection/upload-pp-sheet-images",
  upload.array("images"),
  uploadPPSheetImages
);

// Save PP Sheet Data
router.post("/api/fincheck-inspection/update-pp-sheet-data", updatePPSheetData);

// Submit Full Report (Save All)
router.post(
  "/api/fincheck-inspection/submit-full-report",
  submitFullInspectionReport
);

// Search Previous Reports (QR Tab)
router.get("/api/fincheck-inspection/previous-reports", searchPreviousReports);

export default router;
