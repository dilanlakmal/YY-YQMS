import express from "express";
import {
  getMoNoSearch,
  getOrderDetails,
  getOrderSizes,
  saveWashingSpecs,
  getUploadedSpecsOrders,
  fixWashingSpecsIssues,
  fixTolIssues
} from "../../controller/Common/DTOrdersController.js";

const router = express.Router();

router.get("/api/search-mono", getMoNoSearch);
router.get("/api/order-details/:mono", getOrderDetails);
router.get("/api/order-sizes/:mono/:color", getOrderSizes);
router.post("/api/washing-specs/save", saveWashingSpecs);

router.get("/api/washing-specs/uploaded-list", getUploadedSpecsOrders);

router.post("/api/washing-specs/fix-issues", fixWashingSpecsIssues);
router.post("/api/washing-specs/fix-tol", fixTolIssues);

export default router;
