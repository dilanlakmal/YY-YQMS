import express from "express";
import {
  getAQLValues,
  createAQLValue,
  updateAQLValue,
  deleteAQLValue,
  bulkUpdateAQLValues
} from "../../../controller/PivotY/QASections/QASections_AQL_Values_Controller.js";

const router = express.Router();

// Base route path defined in server.js will precede these
router.get("/api/qa-sections/aql-values/get", getAQLValues);
router.post("/api/qa-sections/aql-values/create", createAQLValue);
router.put("/api/qa-sections/aql-values/update/:id", updateAQLValue);
router.delete("/api/qa-sections/aql-values/delete/:id", deleteAQLValue);

// Bulk Update Route
router.put("/api/qa-sections/aql-values/bulk-update", bulkUpdateAQLValues);

export default router;
