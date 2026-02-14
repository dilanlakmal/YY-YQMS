import express from "express";
import {
  downloadBulkReports,
  checkBulkSpace,
  getRecordCount,
  saveDownloadParth,
  checkSpace,
  validateDownloadParth,
  initializeDownloadStatus,
  getDownloadStatusStats,
  resetDownloadStatus,
  getFactories,
  getDateFilteredStats,
  downloadSingleReportDirect,
  downloadBulkReportsAuto,
  downloadBulkReportsUbuntu,
  downloadBulkReportsCancellable,
  cancelBulkDownload,
  getDownloadResults,
  getJobStatus,
  getPONumbers,
  getStyles,
  getCrossFilteredOptions,
  searchSuppliers,
  searchPONumbers,
  searchStyles,
  getJobZip
} from "../../../controller/PivotY/P88Data/downoloadP88ReportController.js";

const router = express.Router();

router.get("/api/scraping/factories", getFactories);
router.get("/api/scraping/date-filtered-stats", getDateFilteredStats);
router.get("/api/scraping/record-count", getRecordCount);
router.post("/api/scraping/download-bulk-reports", downloadBulkReports);
router.post("/api/scraping/check-bulk-space", checkBulkSpace);
router.post("/api/scraping/print-report", saveDownloadParth);
router.post("/api/scraping/check-space", checkSpace);
router.post("/api/scraping/validate-path", validateDownloadParth);
router.post(
  "/api/scraping/initialize-download-status",
  initializeDownloadStatus
);
router.get("/api/scraping/download-status-stats", getDownloadStatusStats);
router.post("/api/scraping/reset-download-status", resetDownloadStatus);
router.post("/api/scraping/download-single-direct", downloadSingleReportDirect);
router.post(
  "/api/scraping/download-bulk-reports-auto",
  downloadBulkReportsAuto
);
router.post(
  "/api/scraping/download-bulk-reports-ubuntu",
  downloadBulkReportsUbuntu
);
router.post(
  "/api/scraping/download-bulk-reports-cancellable",
  downloadBulkReportsCancellable
);
router.post("/api/scraping/cancel-bulk-download", cancelBulkDownload);
router.get("/api/scraping/download-results/:jobId", getDownloadResults);
router.get("/api/scraping/job-status/:jobId", getJobStatus);
router.get("/api/scraping/po-numbers", getPONumbers);
router.get("/api/scraping/styles", getStyles);
router.get("/api/scraping/cross-filtered-options", getCrossFilteredOptions);
router.get("/api/scraping/search-suppliers", searchSuppliers);
router.get("/api/scraping/search-po-numbers", searchPONumbers);
router.get("/api/scraping/search-styles", searchStyles);
router.get("/api/scraping/job-download/:jobId", getJobZip);

export default router;
