const prisma = require("../config/db");
const { cacheGet, cacheSet, cacheDel, TTL, KEYS } = require("../config/redis");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = KEYS.notifications(userId);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json({ notifications: cached });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    await cacheSet(cacheKey, notifications, TTL.NOTIFICATIONS);
    return res.status(200).json({ notifications });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = KEYS.notificationsUnread(userId);

    const cached = await cacheGet(cacheKey);
    if (cached !== null) {
      return res.status(200).json({ count: cached });
    }

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    await cacheSet(cacheKey, count, TTL.NOTIFICATIONS);
    return res.status(200).json({ count });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch count", error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    await cacheDel(
      KEYS.notificationsUnread(userId),
      KEYS.notifications(userId)
    );

    return res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mark notification", error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    await cacheDel(
      KEYS.notificationsUnread(userId),
      KEYS.notifications(userId)
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mark notifications", error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.notification.delete({ where: { id } });

    await cacheDel(
      KEYS.notificationsUnread(userId),
      KEYS.notifications(userId)
    );

    return res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete notification", error: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
