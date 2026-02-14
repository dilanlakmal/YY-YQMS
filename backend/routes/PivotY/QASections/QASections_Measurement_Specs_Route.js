import express from "express";
import {
  getQASectionsMeasurementSpecs,
  saveQASectionsMeasurementSpecs,
  getQASectionsMeasurementSpecsAW,
  saveQASectionsMeasurementSpecsAW,
  fixAllToleranceValues,
  fixTolerancesByOrder,
  previewToleranceIssues,
  syncBWSelectionToAW,
} from "../../../controller/PivotY/QASections/QASections_Measurement_Specs_Controller.js";

const router = express.Router();

// Before Wash
router.get(
  "/api/qa-sections/measurement-specs/:moNo",
  getQASectionsMeasurementSpecs,
);
router.post(
  "/api/qa-sections/measurement-specs/save",
  saveQASectionsMeasurementSpecs,
);

// After Wash
router.get(
  "/api/qa-sections/measurement-specs-aw/:moNo",
  getQASectionsMeasurementSpecsAW,
);
router.post(
  "/api/qa-sections/measurement-specs-aw/save",
  saveQASectionsMeasurementSpecsAW,
);

// Fix Tolerance Values
router.post(
  "/api/qa-sections/measurement-specs/fix-tolerances",
  fixAllToleranceValues,
);
router.post(
  "/api/qa-sections/measurement-specs/fix-tolerances/:moNo",
  fixTolerancesByOrder,
);
router.get(
  "/api/qa-sections/measurement-specs/preview-tolerance-issues",
  previewToleranceIssues,
);

// Sync BW Selection to AW
router.post(
  "/api/qa-sections/measurement-specs/apply-to-aw",
  syncBWSelectionToAW,
);

export default router;
