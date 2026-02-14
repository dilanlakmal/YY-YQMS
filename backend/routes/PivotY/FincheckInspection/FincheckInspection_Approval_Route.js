import express from "express";
import {
  getApprovalAssignees,
  addApprovalAssignee,
  updateApprovalAssignee,
  deleteApprovalAssignee,
  getBuyersList
} from "../../../controller/PivotY/FincheckInspection/FincheckInspection_Approval_Controller.js";

const router = express.Router();

// --- Approval Assignee Routes ---
router.get("/api/fincheck-approval/list", getApprovalAssignees);
router.post("/api/fincheck-approval/add", addApprovalAssignee);
router.put("/api/fincheck-approval/update/:id", updateApprovalAssignee);
router.delete("/api/fincheck-approval/delete/:id", deleteApprovalAssignee);

// Helper route to get buyers list
router.get("/api/fincheck-approval/buyers", getBuyersList);

export default router;
