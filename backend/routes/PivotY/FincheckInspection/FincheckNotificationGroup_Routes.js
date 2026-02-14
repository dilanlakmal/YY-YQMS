import express from "express";
import {
  getNotificationGroup,
  addNotificationMembers,
  updateNotificationMember,
  removeNotificationMember,
  getNotificationBuyersList
} from "../../../controller/PivotY/FincheckInspection/FincheckNotificationGroup_Controller.js";

const router = express.Router();

router.get("/api/fincheck-notification-group/list", getNotificationGroup);
router.post("/api/fincheck-notification-group/add", addNotificationMembers);
router.put(
  "/api/fincheck-notification-group/update/:id",
  updateNotificationMember
);
router.delete(
  "/api/fincheck-notification-group/delete/:id",
  removeNotificationMember
);
router.get(
  "/api/fincheck-notification-group/buyers",
  getNotificationBuyersList
);

export default router;
