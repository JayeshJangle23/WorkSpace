import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    ClipboardList,
    Send,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Trash2,
    CalendarDays,
    UserCheck,
    Eye,
} from "lucide-react";

import api from "../../api/axios";
import taskService from "../../services/taskService";
import { useAuth } from "../../context/AuthContext";

const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function TaskDetailModal({
    open,
    onClose,
    taskId,
    onUpdated,
}) {
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [reviewNote, setReviewNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchTaskDetail = useCallback(async () => {
        if (!taskId) return;
        try {
            setLoading(true);
            setError("");

            const [taskRes, commentsRes] = await Promise.all([
                api.get(`/tasks/${taskId}`),
                taskService.getComments(taskId),
            ]);

            setTask(taskRes.data.task);
            setComments(commentsRes.comments || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load task");
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        if (open && taskId) {
            fetchTaskDetail();
        }
    }, [open, taskId, fetchTaskDetail]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setCommentLoading(true);
            const data = await taskService.addComment(taskId, newComment.trim());
            setComments((prev) => [...prev, data.comment]);
            setNewComment("");
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to add comment");
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;

        try {
            await taskService.deleteComment(taskId, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to delete");
        }
    };

    const handleSubmitReview = async () => {
        try {
            setActionLoading(true);
            await taskService.submitForReview(taskId);
            await fetchTaskDetail();
            onUpdated?.();
        } catch (err) {
            window.alert(
                err.response?.data?.message || "Failed to submit for review"
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReview = async (reviewStatus) => {
        try {
            setActionLoading(true);
            await taskService.reviewTask(taskId, reviewStatus, reviewNote);
            setReviewNote("");
            await fetchTaskDetail();
            onUpdated?.();
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to review");
        } finally {
            setActionLoading(false);
        }
    };

    const canReview =
        user?.role === "ADMIN" || user?.role === "MANAGER";
    const isAssigned = task?.assignments?.some(
        (a) => a.user?.id === user?.id || a.userId === user?.id
    );
    const canSubmitReview = isAssigned && task?.status === "IN_PROGRESS";
    const canReviewTask = canReview && task?.status === "IN_REVIEW";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="task-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                >
                    <motion.div
                        className="task-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.22 }}
                        style={{ maxWidth: "650px" }}
                    >
                        {/* Header */}
                        <div className="task-modal-header">
                            <div className="task-modal-title">
                                <div className="task-modal-icon">
                                    <ClipboardList size={21} />
                                </div>
                                <div>
                                    <h2>Task Details</h2>
                                    <p>View task info, comments and review</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="task-icon-button"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="empty-state" style={{ padding: "40px" }}>
                                <p>Loading task...</p>
                            </div>
                        ) : error ? (
                            <div className="task-form-error">{error}</div>
                        ) : task ? (
                            <div style={{ padding: "0 24px 24px" }}>
                                {/* Task info */}
                                <div className="task-form-grid">
                                    <div className="task-form-field full">
                                        <label>Title</label>
                                        <strong>{task.title}</strong>
                                    </div>

                                    <div className="task-form-field full">
                                        <label>Description</label>
                                        <p>{task.description || "No description provided."}</p>
                                    </div>

                                    <div className="task-form-field">
                                        <label>Status</label>
                                        <span
                                            className={`task-badge ${task.status === "TODO"
                                                    ? "status-todo"
                                                    : task.status === "IN_PROGRESS"
                                                        ? "status-progress"
                                                        : task.status === "IN_REVIEW"
                                                            ? "status-review"
                                                            : task.status === "COMPLETED"
                                                                ? "status-completed"
                                                                : "status-blocked"
                                                }`}
                                        >
                                            {(task.status || "TODO").replaceAll("_", " ")}
                                        </span>
                                    </div>

                                    <div className="task-form-field">
                                        <label>Priority</label>
                                        <span className="task-badge">
                                            {task.priority || "MEDIUM"}
                                        </span>
                                    </div>

                                    <div className="task-form-field">
                                        <label>Team</label>
                                        <strong>{task.team?.name || "Unknown"}</strong>
                                    </div>

                                    <div className="task-form-field">
                                        <label>Created By</label>
                                        <strong>
                                            {task.createdBy?.fullName || "Unknown"}
                                        </strong>
                                    </div>

                                    <div className="task-form-field">
                                        <label>Start Date</label>
                                        <span>{formatDate(task.startDate)}</span>
                                    </div>

                                    <div className="task-form-field">
                                        <label>Due Date</label>
                                        <span>{formatDate(task.dueDate)}</span>
                                    </div>

                                    {/* Assignees */}
                                    <div className="task-form-field full">
                                        <label>
                                            <UserCheck
                                                size={14}
                                                style={{
                                                    display: "inline",
                                                    marginRight: 4,
                                                }}
                                            />
                                            Assigned To
                                        </label>
                                        {task.assignments && task.assignments.length > 0 ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "8px",
                                                }}
                                            >
                                                {task.assignments.map((a) => (
                                                    <span
                                                        key={a.id}
                                                        className="role-tag"
                                                    >
                                                        {a.user?.fullName || "User"}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span>No assignees</span>
                                        )}
                                    </div>

                                    {/* Review info */}
                                    {task.reviewStatus &&
                                        task.reviewStatus !== "NOT_SUBMITTED" && (
                                            <div className="task-form-field full">
                                                <label>Review Status</label>
                                                <span className="task-badge">
                                                    {task.reviewStatus.replaceAll("_", " ")}
                                                </span>
                                                {task.reviewNote && (
                                                    <p style={{ marginTop: 4, fontSize: 13 }}>
                                                        Note: {task.reviewNote}
                                                    </p>
                                                )}
                                                {task.reviewedBy?.fullName && (
                                                    <small style={{ display: "block", marginTop: 4 }}>
                                                        Reviewed by {task.reviewedBy.fullName} on{" "}
                                                        {formatDateTime(task.reviewedAt)}
                                                    </small>
                                                )}
                                            </div>
                                        )}
                                </div>

                                {/* Action buttons */}
                                {(canSubmitReview || canReviewTask) && (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "8px",
                                            marginTop: "16px",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {canSubmitReview && (
                                            <button
                                                className="primary-button"
                                                onClick={handleSubmitReview}
                                                disabled={actionLoading}
                                            >
                                                <Eye size={16} />
                                                Submit for Review
                                            </button>
                                        )}

                                        {canReviewTask && (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Review note (optional)"
                                                    value={reviewNote}
                                                    onChange={(e) => setReviewNote(e.target.value)}
                                                    style={{ flex: 1, minWidth: "200px" }}
                                                />
                                                <button
                                                    className="primary-button"
                                                    onClick={() => handleReview("APPROVED")}
                                                    disabled={actionLoading}
                                                    style={{ background: "#25A878" }}
                                                >
                                                    <CheckCircle2 size={16} />
                                                    Approve
                                                </button>
                                                <button
                                                    className="primary-button"
                                                    onClick={() =>
                                                        handleReview("CHANGES_REQUESTED")
                                                    }
                                                    disabled={actionLoading}
                                                    style={{ background: "#EF4444" }}
                                                >
                                                    <XCircle size={16} />
                                                    Request Changes
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Comments section */}
                                <div
                                    style={{
                                        marginTop: "24px",
                                        borderTop:
                                            "1px solid var(--border-color, #e2e2e2)",
                                        paddingTop: "16px",
                                    }}
                                >
                                    <h3
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        <MessageSquare size={18} />
                                        Comments ({comments.length})
                                    </h3>

                                    {/* Comments list */}
                                    <div
                                        style={{
                                            maxHeight: "200px",
                                            overflowY: "auto",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        {comments.length === 0 ? (
                                            <p style={{ opacity: 0.6, fontSize: 14 }}>
                                                No comments yet.
                                            </p>
                                        ) : (
                                            comments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    style={{
                                                        padding: "10px 12px",
                                                        borderRadius: "8px",
                                                        marginBottom: "8px",
                                                        background: "rgba(136,119,239,0.04)",
                                                        border: "1px solid var(--border-color, #e2e2e2)",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "flex-start",
                                                        }}
                                                    >
                                                        <div>
                                                            <strong style={{ fontSize: 13 }}>
                                                                {comment.author?.fullName || "User"}
                                                            </strong>
                                                            <small
                                                                style={{
                                                                    display: "block",
                                                                    opacity: 0.5,
                                                                    fontSize: 11,
                                                                }}
                                                            >
                                                                {formatDateTime(comment.createdAt)}
                                                            </small>
                                                        </div>
                                                        {(comment.authorId === user?.id ||
                                                            user?.role === "ADMIN") && (
                                                                <button
                                                                    className="icon-button danger"
                                                                    title="Delete comment"
                                                                    onClick={() =>
                                                                        handleDeleteComment(comment.id)
                                                                    }
                                                                    style={{ padding: "2px" }}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                    </div>
                                                    <p
                                                        style={{
                                                            margin: "6px 0 0",
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add comment */}
                                    <form
                                        onSubmit={handleAddComment}
                                        style={{ display: "flex", gap: "8px" }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onInput={(e) => setNewComment(e.target.value)}
                                            style={{ flex: 1 }}
                                            disabled={commentLoading}
                                        />
                                        <button
                                            type="submit"
                                            className="primary-button"
                                            disabled={commentLoading || !newComment.trim()}
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: "40px" }}>
                                <p>Task not found</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
