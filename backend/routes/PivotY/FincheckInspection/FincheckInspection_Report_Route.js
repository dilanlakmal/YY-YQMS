import express from "express";
import fileUpload from "express-fileupload";
import {
  getInspectionReports,
  getDefectImagesForReport,
  getReportMeasurementSpecs,
  getReportMeasurementPointCalc,
  checkUserPermission,
  checkApprovalPermission,
  getReportImagesAsBase64,
  getReportDefectHeatmap,
  getDefectsByQCInspector,
  getFilterOptions,
  autocompleteOrderNo,
  autocompleteCustStyle,
  autocompletePOLine,
  autocompleteSeason,
  saveUserPreference,
  getUserPreferences,
  deleteUserFilter,
  getLeaderDecision,
  submitLeaderDecision,
  getQANotifications,
  getActionRequiredCount,
  getShippingStageBreakdown,
  getReportForModification,
  copyMeasurementDataToGroup,
  fixMeasurementGroupId,
} from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Report_Controller.js";

import {
  getVapidPublicKey,
  subscribeUser,
  verifySubscription,
} from "../../../controller/PivotY/FincheckInspection/FincheckNotificationController.js";

const router = express.Router();

// Get filtered inspection reports
router.get("/api/fincheck-reports/list", getInspectionReports);

// Get filter options
router.get("/api/fincheck-reports/filter-options", getFilterOptions);

// Autocomplete endpoints
router.get("/api/fincheck-reports/autocomplete/order-no", autocompleteOrderNo);
router.get(
  "/api/fincheck-reports/autocomplete/cust-style",
  autocompleteCustStyle,
);
router.get("/api/fincheck-reports/autocomplete/season", autocompleteSeason);
router.get("/api/fincheck-reports/autocomplete/po-line", autocompletePOLine);

// Route for Defect Images
router.get(
  "/api/fincheck-reports/:reportId/defect-images",
  getDefectImagesForReport,
);

// Get Measurement Specs for a specific Report ID
router.get(
  "/api/fincheck-reports/:reportId/measurement-specs",
  getReportMeasurementSpecs,
);

// Measurement Value Distribution for specific report
router.get(
  "/api/fincheck-inspection/report/:reportId/measurement-point-calc",
  getReportMeasurementPointCalc,
);

// Route to check permission
router.get("/api/fincheck-reports/check-permission", checkUserPermission);

// Route to check Decision/Approval permission
router.get(
  "/api/fincheck-reports/check-approval-permission",
  checkApprovalPermission,
);

// Get all report images as base64 for PDF generation
router.get(
  "/api/fincheck-reports/:reportId/images-base64",
  getReportImagesAsBase64,
);

// GET - Defect Heatmap/Visual Summary
router.get(
  "/api/fincheck-inspection/report/:reportId/defect-heatmap",
  getReportDefectHeatmap,
);

// Get Defects grouped by QC Inspector
router.get(
  "/api/fincheck-inspection/report/:reportId/defects-by-qc",
  getDefectsByQCInspector,
);

// User Preferences Routes
router.post("/api/fincheck-reports/preferences/save", saveUserPreference);
router.get("/api/fincheck-reports/preferences/get", getUserPreferences);
router.post(
  "/api/fincheck-reports/preferences/delete-filter",
  deleteUserFilter,
);

// Get existing decision for a report
router.get("/api/fincheck-reports/get-decision/:reportId", getLeaderDecision);

// POST - Submit Decision (Supports FormData for Audio)
router.post(
  "/api/fincheck-reports/submit-decision",

  // 1. Middleware: Activates only for this route to parse FormData/Audio
  fileUpload({
    createParentPath: true, // Creates folders if missing
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for audio
  }),

  // 2. Controller
  submitLeaderDecision,
);

// Get Notifications for QA
router.get("/api/fincheck-reports/notifications", getQANotifications);

// route (after getQANotifications route)
router.get("/api/fincheck-reports/action-count", getActionRequiredCount);

// ROUTE: Shipping Stage Breakdown
router.get(
  "/api/fincheck-inspection/report/:reportId/shipping-stage-breakdown",
  getShippingStageBreakdown,
);

// PUSH NOTIFICATION ROUTES
router.get("/api/fincheck-reports/push/vapid-key", getVapidPublicKey);
router.post("/api/fincheck-reports/push/subscribe", subscribeUser);
router.post("/api/fincheck-reports/push/verify", verifySubscription);

// Get Report Details specifically for the Modify Tab
router.get("/api/fincheck-modify/report/:reportId", getReportForModification);

// Copy Measurement Data
router.post(
  "/api/fincheck-modify/copy-measurement",
  copyMeasurementDataToGroup,
);

router.post("/api/fincheck-modify/fix-group-id", fixMeasurementGroupId);

export default router;
