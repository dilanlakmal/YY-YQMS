import express from "express";
import {
  CreateTable,
  GetTables,
  UpdateTable,
  DeleteTable
} from "../../../controller/PivotY/QASections/QASections_Table_Controller.js";

const router = express.Router();

router.post("/api/qa-sections-tables", CreateTable);
router.get("/api/qa-sections-tables", GetTables);
router.put("/api/qa-sections-tables/:id", UpdateTable);
router.delete("/api/qa-sections-tables/:id", DeleteTable);

export default router;
