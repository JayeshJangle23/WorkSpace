const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const allowRoles = require("../middleware/roleMiddleware.js");
const {
  getConversations,
  getUsersForChat,
  createDirectConversation,
  createGroupConversation,
  updateGroupConversation,
  deleteGroupConversation,
  addGroupMember,
  removeGroupMember,
  getTeamConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
} = require("../controllers/conversationController.js");

router.get("/", authMiddleware, getConversations);
router.get("/users", authMiddleware, getUsersForChat);
router.post("/direct", authMiddleware, createDirectConversation);
router.get("/team/:teamId", authMiddleware, getTeamConversation);
router.get("/:conversationId/messages", authMiddleware, getMessages);
router.post("/:conversationId/messages", authMiddleware, sendMessage);
router.patch("/:conversationId/read", authMiddleware, markAsRead);
router.delete("/:conversationId/messages/:messageId", authMiddleware, deleteMessage);

router.post("/group", authMiddleware, allowRoles("ADMIN"), createGroupConversation);
router.patch("/group/:conversationId", authMiddleware, allowRoles("ADMIN"), updateGroupConversation);
router.delete("/group/:conversationId", authMiddleware, allowRoles("ADMIN"), deleteGroupConversation);
router.post("/group/:conversationId/members", authMiddleware, allowRoles("ADMIN", "MANAGER"), addGroupMember);
router.delete("/group/:conversationId/members/:userId", authMiddleware, allowRoles("ADMIN", "MANAGER"), removeGroupMember);

module.exports = router;
