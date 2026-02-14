import express from "express";
import {
  manageRole,
  getUserRoles,
  getRoleManagement,
  registerSuperAdmin,
  deleteSuperAdmin,
  updateUserRoles,
  getUserRole,
  searchRoles,
  getUserRoleDetails
} from "../../controller/User/roleManagementController.js";

const router = express.Router();
router.post("/api/role-management", manageRole);
router.get("/api/user-roles/:empId", getUserRoles);
router.get("/api/role-management", getRoleManagement);
router.post("/api/role-management/super-admin", registerSuperAdmin);
router.delete("/api/role-management/super-admin/:empId", deleteSuperAdmin);
router.post("/api/update-user-roles", updateUserRoles);
router.get("/api/user-roles/:empId", getUserRole);

router.get("/api/role-management/search", searchRoles);
router.get("/api/role-management/user-search/:empId", getUserRoleDetails);

export default router;
