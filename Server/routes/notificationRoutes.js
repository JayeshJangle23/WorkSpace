const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController.js");

router.get("/", authMiddleware, getNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.patch("/:id/read", authMiddleware, markAsRead);
router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;
