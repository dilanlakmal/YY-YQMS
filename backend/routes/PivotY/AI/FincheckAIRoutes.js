import express from "express";
import {
  createChat,
  getUserChats,
  getChatById,
  sendMessage,
  renameChat,
  deleteChat,
  clearChatHistory,
  getQuickStats,
  addMessageFeedback,
  togglePinChat,
  archiveChat,
  searchChats,
  getUserAIStats,
  addChatTags,
  getPinnedChats,
  getAIStatus,
} from "../../../controller/PivotY/AI/FincheckAIController.js";

const router = express.Router();

// Chat Management
router.post("/api/fincheck-ai/create", createChat);
router.get("/api/fincheck-ai/list", getUserChats);
router.get("/api/fincheck-ai/chat/:chatId", getChatById);
router.post("/api/fincheck-ai/send", sendMessage);
router.put("/api/fincheck-ai/rename", renameChat);
router.post("/api/fincheck-ai/delete", deleteChat);
router.post("/api/fincheck-ai/clear", clearChatHistory);

// Enhanced Features
router.post("/api/fincheck-ai/feedback", addMessageFeedback);
router.post("/api/fincheck-ai/pin", togglePinChat);
router.post("/api/fincheck-ai/archive", archiveChat);
router.get("/api/fincheck-ai/search", searchChats);
router.post("/api/fincheck-ai/tags", addChatTags);
router.get("/api/fincheck-ai/pinned", getPinnedChats);

// Stats
router.get("/api/fincheck-ai/stats", getQuickStats);
router.get("/api/fincheck-ai/user-stats", getUserAIStats);

router.get("/api/fincheck-ai/status", getAIStatus);

export default router;
