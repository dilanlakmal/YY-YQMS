import express from "express";
import {
  CreateLine,
  GetLines,
  UpdateLine,
  DeleteLine
} from "../../../controller/PivotY/QASections/QASections_Line_Controller.js";

const router = express.Router();

router.post("/api/qa-sections-lines", CreateLine);
router.get("/api/qa-sections-lines", GetLines);
router.put("/api/qa-sections-lines/:id", UpdateLine);
router.delete("/api/qa-sections-lines/:id", DeleteLine);

export default router;
