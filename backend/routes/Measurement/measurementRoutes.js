import express from "express";
import {
  getMeasurementDataByStyle,
  getMatchingStyleNos,
  getMeasurementDataByStyleV2,
} from "../../controller/Measurement/measurementController.js";

const router = express.Router();

router.get("/api/measurement/styles/search", getMatchingStyleNos);
router.get("/api/measurement/:styleNo", getMeasurementDataByStyle);
router.get("/api/measurement-v2/:styleNo", getMeasurementDataByStyleV2);

export default router;
