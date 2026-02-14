import express from "express";
import multer from "multer";
import path from "path";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import {
  loginUser,
  registerUser,
  // resetPassword,
  getUserProfile,
  updateUserProfile,
  getUserDataByToken,
  refreshToken as refreshTokenController
} from "../../controller/User/authController.js";

import authenticateUser from "../../middleware/authenticateUser.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __backendDir = path.dirname(__filename);

// Helper function to generate random string (if not in a shared utils file)
const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId;
    if (!userId) {
      return cb(new Error("User ID is not defined"));
    }
    const dir = path.join(
      __backendDir,
      "../public/storage/profiles/",
      userId.toString()
    );
    // create directory using fs/promises to avoid relying on `fs` sync calls
    fsPromises
      .mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch((err) => cb(err));
  },
  filename: (req, file, cb) => {
    const randomString = Math.random().toString(36).substring(2, 34);
    cb(null, `${randomString}${path.extname(file.originalname)}`);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Images Only! (jpeg, jpg, png, gif)"));
  }
}

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  }
}).single("profile");

const router = express.Router();

// Public routes
router.post("/api/login", loginUser);
router.post("/api/register", registerUser);
// router.post("/api/reset-password", resetPassword);
router.post("/api/refresh-token", refreshTokenController);
router.post("/api/get-user-data", getUserDataByToken); // This might need auth depending on use case

router.put("/api/user-profile", authenticateUser, upload, updateUserProfile);
router.get("/api/user-profile", authenticateUser, getUserProfile);

export default router;
