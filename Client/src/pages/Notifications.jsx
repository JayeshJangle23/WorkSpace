import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  UserPlus,
  Calendar,
} from "lucide-react";

import notificationService from "../services/notificationService";

const notificationIcons = {
  TASK_ASSIGNED: CheckCircle2,
  TASK_UPDATED: RefreshCw,
  TASK_COMMENT: MessageSquare,
  TASK_DUE_SOON: Calendar,
  TASK_OVERDUE: AlertCircle,
  TASK_REVIEWED: CheckCheck,
  MESSAGE: MessageSquare,
  TEAM_ADDED: UserPlus,
  SYSTEM: Bell,
};

const formatTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to mark");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Notifications</h1>
          <p>
            {unreadCount} unread of {notifications.length} total
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="primary-button"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
          >
            <CheckCheck size={18} />
            Mark All Read
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="panel">
        {loading ? (
          <div className="empty-state">
            <RefreshCw className="loading-icon" size={25} />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={42} />
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="notification-list">
            <AnimatePresence>
              {notifications.map((notif, index) => {
                const Icon = notificationIcons[notif.type] || Bell;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      marginBottom: "8px",
                      alignItems: "flex-start",
                      background: notif.isRead
                        ? "transparent"
                        : "rgba(136,119,239,0.06)",
                      border: "1px solid var(--border-color, #e2e2e2)",
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <Icon size={20} color="#8877EF" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{notif.title}</strong>
                      <p
                        style={{
                          margin: "4px 0",
                          fontSize: "14px",
                          opacity: 0.8,
                        }}
                      >
                        {notif.body}
                      </p>
                      <small style={{ opacity: 0.5 }}>
                        {formatTime(notif.createdAt)}
                      </small>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                    >
                      {!notif.isRead && (
                        <button
                          className="icon-button"
                          title="Mark as read"
                          onClick={() => handleMarkAsRead(notif.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        className="icon-button danger"
                        title="Delete"
                        onClick={() => handleDelete(notif.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
