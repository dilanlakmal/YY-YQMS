import express from 'express';
import {
    getFailedReports,
    markAsDownloaded,
    getFailedReportsFilterOptions,
    getFilteredFailedReports,
    generateReportLink,
    generateReportLinkByInspection 
} from '../../../controller/PivotY/P88Data/p88failedReportController.js';
import { downloadSingleReportDirect } from '../../../controller/PivotY/P88Data/downoloadP88ReportController.js';

const router = express.Router();

router.get('/api/p88failedReport/failed-reports', getFailedReports);
router.post('/api/p88failedReport/failed-reports/mark-downloaded', markAsDownloaded);
router.post('/api/p88failedReport/download-single', downloadSingleReportDirect);
router.get('/api/p88failedReport/filter-options', getFailedReportsFilterOptions);
router.get('/api/p88failedReport/filtered-reports', getFilteredFailedReports);
router.post('/api/p88failedReport/generate-report-link', generateReportLink);
router.post('/api/p88failedReport/generate-report-link-by-inspection', generateReportLinkByInspection);

export default router;
