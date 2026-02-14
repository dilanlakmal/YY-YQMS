import express from "express";
import {
  searchUser,
  getUserDetails,
  getJobTitles,
  getUsersByJobTitle,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUsersPaginated,
  getSections,
  getUserByEmpId,
  getUserByEmpIdForInspector,
  searchUsersByEmpIdOrName,
  getWorkingUsers,
} from "../../controller/User/userController.js";

const router = express.Router();

//----Get All users for Role Management ----//
router.get("/api/search-users", searchUser);
router.get("/api/user-details", getUserDetails);
router.get("/api/job-titles", getJobTitles);
router.get("/api/users-by-job-title", getUsersByJobTitle);

//----Get All users ----//
router.get("/api/users", getAllUsers);

//----Get All working users ----//
router.get("/api/users", getWorkingUsers);

//----User Management ----//
router.post("/api/users", createUser);
router.put("/api/users/:id", updateUser);
router.delete("/api/users/:id", deleteUser);

//----User Management: Display ----//

router.get("/api/users/search", searchUsersByEmpIdOrName);
router.get("/api/users-paginated", getUsersPaginated);
router.get("/api/sections", getSections);

//---Get user details by Emp ID ----//
router.get("/api/users/:emp_id", getUserByEmpIdForInspector);
router.get("/api/user-by-emp-id", getUserByEmpId);

export default router;
