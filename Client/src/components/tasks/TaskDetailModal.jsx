import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X, ClipboardList, Send, CheckCircle2, XCircle,
    MessageSquare, Trash2, UserCheck, Eye, Paperclip,
    Upload, Download, FileText, Image, File,
} from "lucide-react";
import api from "../../api/axios";
import taskService from "../../services/taskService";
import { useAuth } from "../../context/AuthContext";

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not set";

const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

const fmtFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType = "") => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("text")) return FileText;
    return File;
};

const statusBadge = {
    TODO: "badge badge-todo",
    IN_PROGRESS: "badge badge-progress",
    IN_REVIEW: "badge badge-review",
    COMPLETED: "badge badge-done",
    BLOCKED: "badge badge-blocked",
};

export default function TaskDetailModal({ open, onClose, taskId, onUpdated }) {
    const { user } = useAuth();
    const [task, setTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [reviewNote, setReviewNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [deletingAttachId, setDeletingAttachId] = useState(null);
    const [error, setError] = useState("");

    const fetchDetail = useCallback(async () => {
        if (!taskId) return;
        try {
            setLoading(true); setError("");
            const [taskRes, commentsRes, attachmentsRes] = await Promise.all([
                api.get(`/tasks/${taskId}`),
                taskService.getComments(taskId),
                api.get(`/tasks/${taskId}/attachments`),
            ]);
            setTask(taskRes.data.task);
            setComments(commentsRes.comments || []);
            setAttachments(attachmentsRes.data.attachments || []);
        } catch (err) { setError(err.response?.data?.message || "Failed to load task"); }
        finally { setLoading(false); }
    }, [taskId]);

    useEffect(() => { if (open && taskId) fetchDetail(); }, [open, taskId, fetchDetail]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            setCommentLoading(true);
            const d = await taskService.addComment(taskId, newComment.trim());
            setComments(p => [...p, d.comment]);
            setNewComment("");
        } catch (err) { window.alert(err.response?.data?.message || "Failed to add comment"); }
        finally { setCommentLoading(false); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await taskService.deleteComment(taskId, commentId);
            setComments(p => p.filter(c => c.id !== commentId));
        } catch (err) { window.alert(err.response?.data?.message || "Failed"); }
    };

    const handleUploadAttachment = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadLoading(true);
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post(`/tasks/${taskId}/attachments`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setAttachments(p => [res.data.attachment, ...p]);
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to upload file");
        } finally {
            setUploadLoading(false);
            e.target.value = ""; 
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!window.confirm("Delete this attachment?")) return;
        try {
            setDeletingAttachId(attachmentId);
            await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
            setAttachments(p => p.filter(a => a.id !== attachmentId));
        } catch (err) {
            window.alert(err.response?.data?.message || "Failed to delete attachment");
        } finally {
            setDeletingAttachId(null);
        }
    };

    const handleSubmitReview = async () => {
        try {
            setActionLoading(true);
            await taskService.submitForReview(taskId);
            await fetchDetail(); onUpdated?.();
        } catch (err) { window.alert(err.response?.data?.message || "Failed to submit"); }
        finally { setActionLoading(false); }
    };

    const handleReview = async (reviewStatus) => {
        try {
            setActionLoading(true);
            await taskService.reviewTask(taskId, reviewStatus, reviewNote);
            setReviewNote(""); await fetchDetail(); onUpdated?.();
        } catch (err) { window.alert(err.response?.data?.message || "Failed to review"); }
        finally { setActionLoading(false); }
    };

    const canReview = user?.role === "ADMIN" || user?.role === "MANAGER";
    const isAssigned = task?.assignments?.some(a => a.user?.id === user?.id || a.userId === user?.id);
    const canSubmit = isAssigned && task?.status === "IN_PROGRESS";
    const canReviewTask = canReview && task?.status === "IN_REVIEW";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="modal-backdrop-bg fixed inset-0 grid place-items-center p-5 z-[120] overflow-y-auto"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <motion.div
                        className="card w-full max-w-[650px] max-h-[90vh] overflow-y-auto"
                        style={{ boxShadow: "var(--shadow-lg)" }}
                        initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22 }}
                    >
                        {}
                        <div className="flex items-start justify-between gap-3 p-6 pb-5"
                            style={{ borderBottom: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0"
                                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                                    <ClipboardList size={21} />
                                </div>
                                <div>
                                    <h2 className="text-token text-base font-bold m-0">Task Details</h2>
                                    <p className="text-muted text-xs mt-1">View info, comments and review</p>
                                </div>
                            </div>
                            <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-muted text-sm">Loading task…</div>
                        ) : error ? (
                            <p className="text-sm px-6 py-4" style={{ color: "var(--danger)" }}>{error}</p>
                        ) : task ? (
                            <div className="p-6 flex flex-col gap-5">
                                {}
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="col-span-2">
                                        <p className="text-muted text-[11px] font-bold uppercase tracking-wide mb-1">Title</p>
                                        <strong className="text-token text-base">{task.title}</strong>
                                    </div>

                                    {task.description && (
                                        <div className="col-span-2">
                                            <p className="text-muted text-[11px] font-bold uppercase tracking-wide mb-1">Description</p>
                                            <p className="text-token text-sm leading-relaxed m-0">{task.description}</p>
                                        </div>
                                    )}

                                    {[
                                        { label: "Status", content: <span className={statusBadge[task.status] || "badge badge-todo"}>{(task.status || "TODO").replaceAll("_", " ")}</span> },
                                        { label: "Priority", content: <span className="badge badge-role">{task.priority}</span> },
                                        { label: "Team", content: <strong className="text-token text-xs">{task.team?.name}</strong> },
                                        { label: "Created By", content: <strong className="text-token text-xs">{task.createdBy?.fullName}</strong> },
                                        { label: "Start Date", content: <span className="text-token text-xs">{fmtDate(task.startDate)}</span> },
                                        { label: "Due Date", content: <span className="text-token text-xs">{fmtDate(task.dueDate)}</span> },
                                    ].map(({ label, content }) => (
                                        <div key={label}>
                                            <p className="text-muted text-[11px] font-bold uppercase tracking-wide mb-1.5">{label}</p>
                                            {content}
                                        </div>
                                    ))}

                                    {}
                                    <div className="col-span-2">
                                        <p className="text-muted text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <UserCheck size={12} /> Assigned To
                                        </p>
                                        {task.assignments?.length ? (
                                            <div className="flex flex-wrap gap-2">
                                                {task.assignments.map(a => (
                                                    <span key={a.id} className="badge badge-role">{a.user?.fullName || "User"}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted text-xs">No assignees</span>
                                        )}
                                    </div>

                                    {}
                                    {task.reviewStatus && task.reviewStatus !== "NOT_SUBMITTED" && (
                                        <div className="col-span-2 p-4 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                            <p className="text-muted text-[11px] font-bold uppercase tracking-wide mb-2">Review Status</p>
                                            <span className="badge badge-role">{task.reviewStatus.replaceAll("_", " ")}</span>
                                            {task.reviewNote && <p className="text-token text-xs mt-2">Note: {task.reviewNote}</p>}
                                            {task.reviewedBy?.fullName && (
                                                <p className="text-muted text-[11px] mt-1.5">
                                                    Reviewed by {task.reviewedBy.fullName} · {fmtDateTime(task.reviewedAt)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {}
                                {(canSubmit || canReviewTask) && (
                                    <div className="flex flex-wrap gap-2.5 pt-1">
                                        {canSubmit && (
                                            <button className="btn-primary text-xs" onClick={handleSubmitReview} disabled={actionLoading}>
                                                <Eye size={14} /> Submit for Review
                                            </button>
                                        )}
                                        {canReviewTask && (
                                            <>
                                                <input className="field flex-1 min-w-[180px] text-xs py-2"
                                                    placeholder="Review note (optional)" value={reviewNote}
                                                    onChange={e => setReviewNote(e.target.value)} />
                                                <button className="btn-primary text-xs" onClick={() => handleReview("APPROVED")}
                                                    disabled={actionLoading} style={{ background: "var(--success)" }}>
                                                    <CheckCircle2 size={14} /> Approve
                                                </button>
                                                <button className="btn-primary text-xs" onClick={() => handleReview("CHANGES_REQUESTED")}
                                                    disabled={actionLoading} style={{ background: "var(--danger)" }}>
                                                    <XCircle size={14} /> Request Changes
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {}
                                <div className="pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-token text-sm font-bold flex items-center gap-2 m-0">
                                            <Paperclip size={16} style={{ color: "var(--accent)" }} />
                                            Attachments ({attachments.length})
                                        </h3>
                                        <label
                                            className="btn-primary text-xs cursor-pointer flex items-center gap-1.5"
                                            style={{ opacity: uploadLoading ? 0.6 : 1, pointerEvents: uploadLoading ? "none" : "auto" }}
                                        >
                                            <Upload size={13} />
                                            {uploadLoading ? "Uploading…" : "Upload File"}
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={handleUploadAttachment}
                                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                                                disabled={uploadLoading}
                                            />
                                        </label>
                                    </div>

                                    {attachments.length === 0 ? (
                                        <p className="text-muted text-xs">No attachments yet.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                            {attachments.map((att) => {
                                                const FileIcon = getFileIcon(att.mimeType);
                                                const canDelete = att.uploadedById === user?.id || user?.role === "ADMIN";
                                                return (
                                                    <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                                                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                                        <div className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0"
                                                            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                                                            <FileIcon size={15} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-token text-xs font-semibold truncate m-0">{att.fileName}</p>
                                                            <small className="text-muted text-[11px]">
                                                                {fmtFileSize(att.fileSize)} · {att.uploadedBy?.fullName}
                                                            </small>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <a href={att.fileUrl} target="_blank" rel="noreferrer"
                                                                className="btn-icon" title="Download">
                                                                <Download size={13} />
                                                            </a>
                                                            {canDelete && (
                                                                <button className="btn-icon danger" title="Delete"
                                                                    disabled={deletingAttachId === att.id}
                                                                    onClick={() => handleDeleteAttachment(att.id)}>
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {}
                                <div className="pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                                    <h3 className="text-token text-sm font-bold flex items-center gap-2 mb-4">
                                        <MessageSquare size={16} style={{ color: "var(--accent)" }} />
                                        Comments ({comments.length})
                                    </h3>

                                    <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto mb-4">
                                        {comments.length === 0 ? (
                                            <p className="text-muted text-xs">No comments yet.</p>
                                        ) : comments.map((c) => (
                                            <div key={c.id} className="p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <strong className="text-token text-xs">{c.author?.fullName || "User"}</strong>
                                                        <small className="block text-muted text-[11px] mt-0.5">{fmtDateTime(c.createdAt)}</small>
                                                    </div>
                                                    {(c.authorId === user?.id || user?.role === "ADMIN") && (
                                                        <button className="btn-icon danger" style={{ width: 28, height: 28 }}
                                                            onClick={() => handleDeleteComment(c.id)}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-token text-xs leading-relaxed mt-2 mb-0">{c.content}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <form onSubmit={handleAddComment} className="flex gap-2">
                                        <input
                                            className="field flex-1 text-xs py-2"
                                            placeholder="Add a comment…"
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            disabled={commentLoading}
                                        />
                                        <button className="btn-primary px-4" type="submit" disabled={commentLoading || !newComment.trim()}>
                                            <Send size={15} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-16 text-muted text-sm">Task not found</div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
