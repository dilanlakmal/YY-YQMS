import express from "express";
import {
  UpsertBuyerConfig,
  GetBuyerConfigs
} from "../../../controller/PivotY/QASections/QASections_AQL_Config_Controller.js";

const router = express.Router();

router.post("/api/qa-sections/aql-buyer-config/upsert", UpsertBuyerConfig);
router.get("/api/qa-sections/aql-buyer-config/get", GetBuyerConfigs);

export default router;
