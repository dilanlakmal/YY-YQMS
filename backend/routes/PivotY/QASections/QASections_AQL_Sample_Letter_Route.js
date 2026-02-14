import express from "express";
import {
  getAQLSampleLetters,
  createAQLSampleLetter,
  updateAQLSampleLetter,
  deleteAQLSampleLetter,
  calculateAQLResult
} from "../../../controller/PivotY/QASections/QASections_AQL_Sample_Letter_Controller.js";

const router = express.Router();

// Base route path defined in server.js will precede these
router.get("/api/qa-sections/aql-sample-letters/get", getAQLSampleLetters);
router.post(
  "/api/qa-sections/aql-sample-letters/create",
  createAQLSampleLetter
);
router.put(
  "/api/qa-sections/aql-sample-letters/update/:id",
  updateAQLSampleLetter
);
router.delete(
  "/api/qa-sections/aql-sample-letters/delete/:id",
  deleteAQLSampleLetter
);

export default router;

// ---------------------------------------------------------
// ROUTE: Calculate AQL Level
// ---------------------------------------------------------
router.post("/api/qa-sections/aql/calculate", calculateAQLResult);
