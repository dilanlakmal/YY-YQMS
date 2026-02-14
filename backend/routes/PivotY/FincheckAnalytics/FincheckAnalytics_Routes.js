import express from "express";
import {
  getQAAnalyticsSummary,
  getQAStyleAnalytics,
  getQATrendAnalytics,
  getStyleSummaryAnalytics,
  getStyleTrendAnalytics,
  getStyleSummaryDefectMap,
  getStyleMeasurementAnalytics,
  getStyleMeasurementConclusion,
  getStyleMeasurementPointCalc,
  getBuyerSummaryAnalytics,
  getBuyerCellDetails,
} from "../../../controller/PivotY/FincheckAnalytics/FincheckAnalytics_Controller.js";

const router = express.Router();

// GET: QA Summary Analytics
router.get("/api/fincheck-analytics/qa-summary", getQAAnalyticsSummary);
router.get("/api/fincheck-analytics/qa-style-breakdown", getQAStyleAnalytics);
router.get("/api/fincheck-analytics/qa-trend", getQATrendAnalytics);

// GET: Style Summary Analytics
router.get("/api/fincheck-analytics/style-summary", getStyleSummaryAnalytics);
router.get("/api/fincheck-analytics/style-trend", getStyleTrendAnalytics);
router.get(
  "/api/fincheck-analytics/style-location-map",
  getStyleSummaryDefectMap,
);
router.get(
  "/api/fincheck-analytics/style-measurement",
  getStyleMeasurementAnalytics,
);

router.get(
  "/api/fincheck-analytics/style-measurement-conclusion",
  getStyleMeasurementConclusion,
);

router.get(
  "/api/fincheck-analytics/style-measurement-point-calc",
  getStyleMeasurementPointCalc,
);

// GET: Buyer Analytics
router.get("/api/fincheck-analytics/buyer-summary", getBuyerSummaryAnalytics);
router.get("/api/fincheck-analytics/buyer-cell-details", getBuyerCellDetails);

export default router;
