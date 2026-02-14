import express from "express";
import {
  CreateBuyer,
  GetBuyers,
  UpdateBuyer,
  DeleteBuyer
} from "../../../controller/PivotY/QASections/QASections_Buyer_Controller.js";

const router = express.Router();

router.post("/api/qa-sections-buyers", CreateBuyer);
router.get("/api/qa-sections-buyers", GetBuyers);
router.put("/api/qa-sections-buyers/:id", UpdateBuyer);
router.delete("/api/qa-sections-buyers/:id", DeleteBuyer);

export default router;
