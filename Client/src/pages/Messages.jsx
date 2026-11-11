import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send, RefreshCw, Plus, MessageSquare, Users, User,
  Settings, UserPlus, UserMinus, Trash2, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import conversationService from "../services/conversationService";
import Modal from "../components/Modal";

export default function Messages() {
  const { user } = useAuth();

  // ── Conversation & message state ─────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // ── New conversation modal state ─────────────────────────────
  const [showNewModal, setShowNewModal] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [modalTab, setModalTab] = useState("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // ── Group management state ───────────────────────────────────
  const [groupModal, setGroupModal] = useState(""); // "rename"|"addMember"|"members"
  const [editGroupName, setEditGroupName] = useState("");
  const [addMemberId, setAddMemberId] = useState("");

  // ── Mobile: show chat panel when conversation selected ───────
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // ── Permissions ──────────────────────────────────────────────
  const isAdmin = user?.role === "ADMIN";
  const canManageGroups = isAdmin || user?.role === "MANAGER";

  // ── Helpers ──────────────────────────────────────────────────
  const getConvName = (conv) => {
    if (!conv) return "";
    if (conv.type === "TEAM") return conv.title || conv.team?.name || "Team Chat";
    if (conv.type === "GROUP") return conv.title || "Group Chat";
    const other = conv.members?.find((m) => m.userId !== user?.id);
    return other?.user?.fullName || "Direct Message";
  };

  const getConvLabel = (conv) => {
    if (conv.type === "TEAM") return "Team Chat";
    if (conv.type === "GROUP") return `${conv.members?.length || 0} members`;
    return "Direct Message";
  };

  const getConvAvatar = (conv) => {
    if (conv.type === "TEAM" || conv.type === "GROUP") return null; // show icon
    return getConvName(conv).charAt(0).toUpperCase();
  };

  // ── Data fetching ─────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const data = await conversationService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load conversations");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId) => {
    try {
      setMsgLoading(true);
      const data = await conversationService.getMessages(convId);
      setMessages(data.messages || []);
      await conversationService.markAsRead(convId).catch(() => { });
      setConversations((prev) =>
        prev.map((c) => c.id === convId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally { setMsgLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedConv) fetchMessages(selectedConv.id);
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Select conversation (handle mobile nav) ───────────────────
  const selectConv = (conv) => {
    setSelectedConv(conv);
    setMobileShowChat(true);
  };

  const goBackToList = () => {
    setMobileShowChat(false);
    setSelectedConv(null);
  };

  // ── Send message ──────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;
    try {
      setSending(true);
      const data = await conversationService.sendMessage(selectedConv.id, newMessage.trim());
      setMessages((prev) => [...prev, data.data]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, messages: [data.data], updatedAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to send");
    } finally { setSending(false); }
  };

  // ── New conversation modal ────────────────────────────────────
  const openNewModal = async () => {
    try {
      const data = await conversationService.getUsersForChat();
      setChatUsers(data.users || []);
      setModalTab("direct"); setGroupName(""); setSelectedMembers([]);
      setShowNewModal(true);
    } catch { setError("Failed to load users"); }
  };

  const handleStartDirect = async (targetUserId) => {
    try {
      const data = await conversationService.createDirectConversation(targetUserId);
      setShowNewModal(false);
      if (!conversations.find((c) => c.id === data.conversation.id)) {
        setConversations((prev) => [data.conversation, ...prev]);
      }
      selectConv(data.conversation);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create conversation");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return window.alert("Group name required");
    if (!selectedMembers.length) return window.alert("Select at least one member");
    try {
      setCreatingGroup(true);
      const data = await conversationService.createGroupConversation(groupName.trim(), selectedMembers);
      setShowNewModal(false); setGroupName(""); setSelectedMembers([]);
      setConversations((prev) => [data.conversation, ...prev]);
      selectConv(data.conversation);
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to create group");
    } finally { setCreatingGroup(false); }
  };

  const toggleMember = (id) =>
    setSelectedMembers((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // ── Group management ──────────────────────────────────────────
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      const data = await conversationService.updateGroupConversation(selectedConv.id, editGroupName);
      setConversations((prev) => prev.map((c) => c.id === selectedConv.id ? data.conversation : c));
      setSelectedConv(data.conversation); setGroupModal("");
    } catch (err) { window.alert(err.response?.data?.message || "Failed"); }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group? All messages will be lost.")) return;
    try {
      await conversationService.deleteGroupConversation(selectedConv.id);
      setConversations((prev) => prev.filter((c) => c.id !== selectedConv.id));
      setSelectedConv(null); setMobileShowChat(false); setGroupModal("");
    } catch (err) { window.alert(err.response?.data?.message || "Failed"); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberId) return;
    try {
      const data = await conversationService.addGroupMember(selectedConv.id, addMemberId);
      const updated = { ...selectedConv, members: [...(selectedConv.members || []), data.member] };
      setSelectedConv(updated);
      setConversations((prev) => prev.map((c) => c.id === selectedConv.id ? updated : c));
      setAddMemberId(""); setGroupModal("");
    } catch (err) { window.alert(err.response?.data?.message || "Failed"); }
  };

  const handleRemoveMember = async (uid) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await conversationService.removeGroupMember(selectedConv.id, uid);
      const updated = { ...selectedConv, members: selectedConv.members.filter((m) => m.userId !== uid) };
      setSelectedConv(updated);
      setConversations((prev) => prev.map((c) => c.id === selectedConv.id ? updated : c));
    } catch (err) { window.alert(err.response?.data?.message || "Failed"); }
  };

  const availableUsers = chatUsers.filter(
    (u) => !selectedConv?.members?.some((m) => m.userId === u.id)
  );

  /* ── Conversation list item ─────────────────────────────────── */
  const ConvItem = ({ conv }) => {
    const isSelected = selectedConv?.id === conv.id;
    return (
      <button
        type="button"
        onClick={() => selectConv(conv)}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${isSelected ? "bg-surface-2" : "hover:bg-surface-2"
          }`}
        style={{ border: isSelected ? "1px solid var(--border)" : "1px solid transparent" }}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 font-heading font-bold text-sm"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {conv.type === "TEAM" || conv.type === "GROUP"
            ? <Users size={16} />
            : getConvAvatar(conv)}
        </div>

        <div className="flex-1 min-w-0">
          <strong className="block text-token text-sm font-heading truncate">{getConvName(conv)}</strong>
          <small className="block text-muted text-xs truncate mt-0.5">
            {conv.messages?.[0]?.content || "No messages yet"}
          </small>
        </div>

        {conv.unreadCount > 0 && (
          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {conv.unreadCount}
          </span>
        )}
      </button>
    );
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="page-pad flex flex-col gap-5" style={{ height: "calc(100dvh - 64px)", overflow: "hidden" }}>

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="font-heading text-token text-2xl font-extrabold tracking-tight">Messages</h1>
          <p className="text-muted text-sm mt-0.5">Communicate with your team in real time.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <Plus size={16} /> <span className="hide-mobile">New Chat</span>
        </button>
      </div>

      {error && (
        <p className="text-sm px-4 py-3 rounded-xl flex-shrink-0"
          style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>{error}</p>
      )}

      {/* Chat layout: 2-column on desktop, full-screen panels on mobile */}
      <div className="flex gap-4 min-h-0 flex-1">

        {/* ── Conversation list panel ───────────────────────── */}
        <div
          className={`card flex flex-col min-h-0 w-full md:w-72 lg:w-80 flex-shrink-0 ${mobileShowChat ? "hidden md:flex" : "flex"
            }`}
        >
          <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="font-heading text-token text-sm font-bold">Conversations</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted">
                <RefreshCw size={22} className="spin" style={{ color: "var(--accent)" }} />
                <p className="text-xs">Loading…</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted">
                <MessageSquare size={32} style={{ opacity: .4, color: "var(--accent)" }} />
                <p className="text-xs">No conversations yet</p>
                <button className="btn-primary text-xs py-1.5 px-3" onClick={openNewModal}>
                  Start a chat
                </button>
              </div>
            ) : (
              conversations.map((conv) => <ConvItem key={conv.id} conv={conv} />)
            )}
          </div>
        </div>

        {/* ── Message area panel ───────────────────────────── */}
        <div
          className={`card flex-1 flex flex-col min-h-0 min-w-0 ${!mobileShowChat && selectedConv === null ? "hidden md:flex" : "flex"
            } ${!mobileShowChat && !selectedConv ? "hidden md:flex" : ""}`}
        >
          {!selectedConv ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-4 flex-1 text-muted">
              <div className="w-16 h-16 rounded-2xl grid place-items-center"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <MessageSquare size={32} />
              </div>
              <div className="text-center">
                <h3 className="font-heading text-token text-base font-bold">Select a conversation</h3>
                <p className="text-sm mt-1">Choose from the list or start a new chat.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 flex-shrink-0"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile back button */}
                  <button className="btn-icon md:hidden flex-shrink-0" onClick={goBackToList}>
                    <ArrowLeft size={17} />
                  </button>

                  <div className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {selectedConv.type === "TEAM" || selectedConv.type === "GROUP"
                      ? <Users size={16} />
                      : <span className="font-heading font-bold text-sm">{getConvName(selectedConv).charAt(0)}</span>}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-heading text-token text-sm font-bold truncate">{getConvName(selectedConv)}</h3>
                    <p className="text-muted text-xs">{getConvLabel(selectedConv)}</p>
                  </div>
                </div>

                {/* Group management toolbar */}
                {selectedConv.type === "GROUP" && canManageGroups && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button className="btn-icon" title="Add member" onClick={async () => {
                      const d = await conversationService.getUsersForChat();
                      setChatUsers(d.users || []); setAddMemberId(""); setGroupModal("addMember");
                    }}>
                      <UserPlus size={15} />
                    </button>
                    <button className="btn-icon" title="Members" onClick={() => setGroupModal("members")}>
                      <Users size={15} />
                    </button>
                    {isAdmin && (
                      <>
                        <button className="btn-icon" title="Rename" onClick={() => { setEditGroupName(selectedConv.title || ""); setGroupModal("rename"); }}>
                          <Settings size={15} />
                        </button>
                        <button className="btn-icon danger" title="Delete group" onClick={handleDeleteGroup}>
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center flex-1 text-muted">
                    <RefreshCw size={22} className="spin" style={{ color: "var(--accent)" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-2 text-muted">
                    <MessageSquare size={28} style={{ opacity: .4 }} />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 shadow-sm ${isOwn ? "bubble-own" : "bubble-other"
                            }`}
                        >
                          {!isOwn && (
                            <strong className="block font-heading text-[11px] font-bold mb-1"
                              style={{ color: "var(--accent)" }}>
                              {msg.sender?.fullName}
                            </strong>
                          )}
                          <p className="text-sm leading-relaxed m-0">{msg.content}</p>
                          <small className={`block text-[10px] mt-1.5 ${isOwn ? "text-white/60" : "text-muted"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </small>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <input
                  className="field flex-1"
                  type="text"
                  placeholder="Type a message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button className="btn-primary px-4 flex-shrink-0" type="submit"
                  disabled={sending || !newMessage.trim()}>
                  <Send size={17} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          MODALS
      ───────────────────────────────────────────────────── */}

      {/* New conversation */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Start New Conversation">
        {/* Tab bar */}
        <div className="flex gap-2 mt-3 mb-4">
          <button className={modalTab === "direct" ? "btn-primary flex-1 text-xs" : "btn-secondary flex-1 text-xs"}
            onClick={() => setModalTab("direct")}>
            <User size={13} /> Direct
          </button>
          {isAdmin && (
            <button className={modalTab === "group" ? "btn-primary flex-1 text-xs" : "btn-secondary flex-1 text-xs"}
              onClick={() => setModalTab("group")}>
              <Users size={13} /> Create Group
            </button>
          )}
        </div>

        {/* Direct tab */}
        {modalTab === "direct" && (
          <div className="flex flex-col gap-2">
            <p className="text-muted text-xs font-bold uppercase tracking-wide">Select a user</p>
            {chatUsers.length === 0 ? (
              <p className="text-muted text-sm">No users available</p>
            ) : chatUsers.map((u) => (
              <button key={u.id} type="button" onClick={() => handleStartDirect(u.id)}
                className="flex items-center gap-3 p-3 rounded-xl text-left w-full hover:bg-surface-2 transition-colors"
                style={{ border: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-xl grid place-items-center font-bold text-sm flex-shrink-0"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {u.fullName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <strong className="block text-token text-sm truncate">{u.fullName}</strong>
                  <small className="block text-muted text-xs truncate">{u.email}</small>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Group tab (admin only) */}
        {modalTab === "group" && isAdmin && (
          <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>Group Name *</label>
              <input className="field" type="text" placeholder="e.g. Project Alpha"
                value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold" style={{ color: "var(--text-2)" }}>
                Select Members * ({selectedMembers.length} selected)
              </label>
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto p-2 rounded-xl"
                style={{ border: "1.5px solid var(--border)", background: "var(--surface-2)" }}>
                {chatUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2.5 cursor-pointer px-2 py-2 rounded-lg hover:bg-surface transition">
                    <input type="checkbox" checked={selectedMembers.includes(u.id)} onChange={() => toggleMember(u.id)} />
                    <div className="w-7 h-7 rounded-lg grid place-items-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                      {u.fullName?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <strong className="text-token text-xs font-semibold truncate block">{u.fullName}</strong>
                      <small className="text-muted text-[10px] truncate block">{u.email}</small>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={creatingGroup}>
              {creatingGroup ? "Creating…" : "Create Group"}
            </button>
          </form>
        )}
      </Modal>

      {/* Rename group */}
      <Modal open={groupModal === "rename"} onClose={() => setGroupModal("")} title="Rename Group">
        <form onSubmit={handleUpdateGroup} className="flex flex-col gap-3 mt-3">
          <input className="field" type="text" value={editGroupName}
            onChange={(e) => setEditGroupName(e.target.value)} required />
          <button className="btn-primary" type="submit">Save Changes</button>
        </form>
      </Modal>

      {/* Add member */}
      <Modal open={groupModal === "addMember"} onClose={() => setGroupModal("")} title="Add Member">
        <form onSubmit={handleAddMember} className="flex flex-col gap-3 mt-3">
          {availableUsers.length === 0 ? (
            <p className="text-muted text-sm">All users are already in this group.</p>
          ) : (
            <select className="field" value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)} required>
              <option value="">Select a user</option>
              {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
            </select>
          )}
          <button className="btn-primary" type="submit">
            <UserPlus size={15} /> Add Member
          </button>
        </form>
      </Modal>

      {/* Members list */}
      <Modal open={groupModal === "members"} onClose={() => setGroupModal("")}
        title={`Members (${selectedConv?.members?.length || 0})`}>
        <div className="flex flex-col gap-2 mt-3">
          {selectedConv?.members?.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
              style={{ border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg grid place-items-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {m.user?.fullName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <strong className="text-token text-xs font-semibold truncate block">{m.user?.fullName}</strong>
                  <small className="text-muted text-[11px] truncate block">{m.user?.email}</small>
                </div>
              </div>
              {canManageGroups && m.userId !== user?.id && (
                <button className="btn-icon danger flex-shrink-0" title="Remove" onClick={() => handleRemoveMember(m.userId)}>
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          ))}
          {!selectedConv?.members?.length && <p className="text-muted text-sm">No members.</p>}
        </div>
      </Modal>
    </div>
  );
}
