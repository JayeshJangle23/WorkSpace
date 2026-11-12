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
import { useSocket } from "../context/SocketContext";

const iconMap = {
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

const fmtTime = (d) => {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setAction] = useState(false);
  const { socket, connected } = useSocket();

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const d = await notificationService.getNotifications();
      setNotifs(d.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);
  useEffect(() => {
  if (!socket || !connected) return;

  const handleNewNotification = (notification) => {
    setNotifs((prev) => {
      if (prev.some((n) => n.id === notification.id)) {
        return prev;
      }

      return [notification, ...prev];
    });
  };

  socket.on("notification:new", handleNewNotification);

  return () => {
    socket.off("notification:new", handleNewNotification);
  };
}, [socket, connected]);

  const markRead = async (id) => {
    try {
      setAction(true);
      await notificationService.markAsRead(id);
      setNotifs((p) =>
        p.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      /* silent */
    } finally {
      setAction(false);
    }
  };

  const markAll = async () => {
    try {
      setAction(true);
      await notificationService.markAllAsRead();
      setNotifs((p) => p.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* silent */
    } finally {
      setAction(false);
    }
  };

  const del = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifs((p) => p.filter((n) => n.id !== id));
    } catch {
      /* silent */
    }
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="page-pad flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-token text-2xl font-extrabold tracking-tight m-0 mb-1">
            Notifications
          </h1>
          <p className="font-body text-muted text-sm m-0">
            {unread} unread · {notifs.length} total
          </p>
        </div>
        {unread > 0 && (
          <button
            className="btn-primary"
            onClick={markAll}
            disabled={actionLoading}
          >
            <CheckCheck size={17} /> Mark All Read
          </button>
        )}
      </div>

      {error && (
        <p
          className="text-sm px-4 py-3 rounded-lg"
          style={{ color: "var(--danger)", background: "var(--danger-bg)" }}
        >
          {error}
        </p>
      )}

      <div className="card p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <RefreshCw
              size={26}
              className="spin"
              style={{ color: "var(--accent)" }}
            />
            <p className="text-sm">Loading notifications…</p>
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <Bell size={42} style={{ opacity: 0.4, color: "var(--accent)" }} />
            <h3 className="text-token text-base m-0">No notifications</h3>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifs.map((n, i) => {
              const Icon = iconMap[n.type] || Bell;
              return (
                <motion.div
                  key={n.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl mb-2 transition-colors"
                  style={{
                    background: n.isRead
                      ? "transparent"
                      : "rgba(124,58,237,.05)",
                    border: "1px solid var(--border)",
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div
                    className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                  >
                    <Icon size={17} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <strong className="block text-token text-sm">
                      {n.title}
                    </strong>
                    <p className="text-muted text-xs leading-relaxed mt-1 mb-0 line-clamp-2">
                      {n.body}
                    </p>
                    <small className="text-muted text-[11px] mt-1.5 block">
                      {fmtTime(n.createdAt)}
                    </small>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!n.isRead && (
                      <button
                        className="btn-icon"
                        title="Mark as read"
                        onClick={() => markRead(n.id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                    <button
                      className="btn-icon danger"
                      title="Delete"
                      onClick={() => del(n.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
