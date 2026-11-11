import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  RefreshCw,
  Plus,
  MessageSquare,
  Users,
  User,
  Settings,
  UserPlus,
  UserMinus,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import conversationService from "../services/conversationService";
import Modal from "../components/Modal";

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Group creation state
  const [modalTab, setModalTab] = useState("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Group management state
  const [showGroupModal, setShowGroupModal] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [addMemberId, setAddMemberId] = useState("");

  // Permission helpers
  const isAdmin = user?.role === "ADMIN";
  const canManageGroups = user?.role === "ADMIN" || user?.role === "MANAGER";

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await conversationService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load conversations"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId) => {
    try {
      setMessagesLoading(true);
      const data = await conversationService.getMessages(convId);
      setMessages(data.messages || []);
      await conversationService.markAsRead(convId).catch(() => { });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load messages"
      );
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    try {
      setSending(true);
      const data = await conversationService.sendMessage(
        selectedConv.id,
        newMessage.trim()
      );
      setMessages((prev) => [...prev, data.data]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? {
              ...c,
              messages: [data.data],
              updatedAt: new Date().toISOString(),
            }
            : c
        )
      );
    } catch (err) {
      window.alert(
        err.response?.data?.message || "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const openNewModal = async () => {
    try {
      const data = await conversationService.getUsersForChat();
      setChatUsers(data.users || []);
      setModalTab(isAdmin ? "direct" : "direct");
      setGroupName("");
      setSelectedMembers([]);
      setShowNewModal(true);
    } catch (err) {
      setError("Failed to load users");
    }
  };

  const handleStartDirect = async (targetUserId) => {
    try {
      const data =
        await conversationService.createDirectConversation(
          targetUserId
        );
      setShowNewModal(false);
      const exists = conversations.find(
        (c) => c.id === data.conversation.id
      );
      if (!exists) {
        setConversations((prev) => [data.conversation, ...prev]);
      }
      setSelectedConv(data.conversation);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create conversation"
      );
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      window.alert("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      window.alert("Select at least one member");
      return;
    }

    try {
      setCreatingGroup(true);
      const data = await conversationService.createGroupConversation(
        groupName.trim(),
        selectedMembers
      );
      setShowNewModal(false);
      setGroupName("");
      setSelectedMembers([]);
      setConversations((prev) => [data.conversation, ...prev]);
      setSelectedConv(data.conversation);
    } catch (err) {
      window.alert(
        err.response?.data?.message || "Failed to create group"
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  // ─── Group management handlers ──────────────────────────────────
  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      const data = await conversationService.updateGroupConversation(
        selectedConv.id,
        editGroupName
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id ? data.conversation : c
        )
      );
      setSelectedConv(data.conversation);
      setShowGroupModal("");
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to update");
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group? All messages will be lost.")) return;
    try {
      await conversationService.deleteGroupConversation(selectedConv.id);
      setConversations((prev) => prev.filter((c) => c.id !== selectedConv.id));
      setSelectedConv(null);
      setShowGroupModal("");
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberId) return;
    try {
      const data = await conversationService.addGroupMember(
        selectedConv.id,
        addMemberId
      );
      // Refresh the selected conversation's members
      const updated = {
        ...selectedConv,
        members: [...(selectedConv.members || []), data.member],
      };
      setSelectedConv(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? updated : c))
      );
      setAddMemberId("");
      setShowGroupModal("");
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm("Remove this member from the group?")) return;
    try {
      await conversationService.removeGroupMember(
        selectedConv.id,
        memberUserId
      );
      const updated = {
        ...selectedConv,
        members: selectedConv.members.filter(
          (m) => m.userId !== memberUserId
        ),
      };
      setSelectedConv(updated);
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? updated : c))
      );
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to remove");
    }
  };

  const getConvName = (conv) => {
    if (conv.type === "TEAM") {
      return conv.title || conv.team?.name || "Team Chat";
    }
    if (conv.type === "GROUP") {
      return conv.title || "Group Chat";
    }
    const otherMember = conv.members?.find(
      (m) => m.userId !== user?.id
    );
    return otherMember?.user?.fullName || "Direct Message";
  };

  const getConvTypeLabel = (conv) => {
    if (conv.type === "TEAM") return "Team Chat";
    if (conv.type === "GROUP") return `${conv.members?.length || 0} members`;
    return "Direct Message";
  };

  // Users not already in the group (for add member dropdown)
  const availableUsers = chatUsers.filter(
    (u) => !selectedConv?.members?.some((m) => m.userId === u.id)
  );

  return (
    <div
      className="page-content"
      style={{
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="page-heading">
        <div>
          <h1>Messages</h1>
          <p>Communicate with your team in real time.</p>
        </div>
        <button className="primary-button" onClick={openNewModal}>
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "16px",
          minHeight: 0,
        }}
      >
        {/* Conversation list */}
        <div
          className="panel"
          style={{
            width: "300px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div className="table-heading">
            <h3>Conversations</h3>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div className="empty-state">
                <RefreshCw className="loading-icon" size={20} />
                <p>Loading...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={32} />
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    marginBottom: "4px",
                    background:
                      selectedConv?.id === conv.id
                        ? "rgba(136,119,239,0.1)"
                        : "transparent",
                  }}
                >
                  <div
                    className="sidebar-avatar"
                    style={{ flexShrink: 0 }}
                  >
                    {conv.type === "TEAM" ? (
                      <Users size={16} />
                    ) : conv.type === "GROUP" ? (
                      getConvName(conv).charAt(0).toUpperCase()
                    ) : (
                      getConvName(conv).charAt(0)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: "14px" }}>
                      {getConvName(conv)}
                    </strong>
                    <small
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conv.messages?.[0]?.content || "No messages yet"}
                    </small>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span
                      style={{
                        background: "#8877EF",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "2px 7px",
                        borderRadius: "10px",
                      }}
                    >
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message area */}
        <div
          className="panel"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {!selectedConv ? (
            <div
              className="empty-state"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageSquare size={42} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation to start messaging</p>
            </div>
          ) : (
            <>
              <div
                className="table-heading"
                style={{
                  borderBottom:
                    "1px solid var(--border-color, #e2e2e2)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3>{getConvName(selectedConv)}</h3>
                  <p>{getConvTypeLabel(selectedConv)}</p>
                </div>

                {/* Group management buttons */}
                {selectedConv.type === "GROUP" && canManageGroups && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      className="icon-button"
                      title="Add member"
                      onClick={async () => {
                        const data =
                          await conversationService.getUsersForChat();
                        setChatUsers(data.users || []);
                        setAddMemberId("");
                        setShowGroupModal("addMember");
                      }}
                    >
                      <UserPlus size={17} />
                    </button>

                    <button
                      className="icon-button"
                      title="Manage members"
                      onClick={() => setShowGroupModal("members")}
                    >
                      <Users size={17} />
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          className="icon-button"
                          title="Rename group"
                          onClick={() => {
                            setEditGroupName(selectedConv.title || "");
                            setShowGroupModal("rename");
                          }}
                        >
                          <Settings size={17} />
                        </button>
                        <button
                          className="icon-button danger"
                          title="Delete group"
                          onClick={handleDeleteGroup}
                        >
                          <Trash2 size={17} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                }}
              >
                {messagesLoading ? (
                  <div className="empty-state">
                    <RefreshCw className="loading-icon" size={20} />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: isOwn
                            ? "flex-end"
                            : "flex-start",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            padding: "10px 14px",
                            borderRadius: "12px",
                            background: isOwn
                              ? "#8877EF"
                              : "var(--msg-bg, #f0f0f0)",
                            color: isOwn ? "#fff" : "inherit",
                          }}
                        >
                          {!isOwn && (
                            <small
                              style={{
                                fontWeight: 600,
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              {msg.sender?.fullName}
                            </small>
                          )}
                          <p style={{ margin: 0 }}>{msg.content}</p>
                          <small
                            style={{
                              opacity: 0.6,
                              fontSize: "11px",
                            }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: "12px 16px",
                  borderTop:
                    "1px solid var(--border-color, #e2e2e2)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1 }}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="primary-button"
                  disabled={sending || !newMessage.trim()}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ─── New conversation modal ─────────────────────────────── */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Start New Conversation"
      >
        {/* Tabs — only show "Create Group" for ADMIN */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            className={
              modalTab === "direct" ? "primary-button" : "secondary-button"
            }
            onClick={() => setModalTab("direct")}
            style={{ flex: 1 }}
          >
            <User size={16} style={{ display: "inline", marginRight: 4 }} />
            Direct Message
          </button>

          {isAdmin && (
            <button
              className={
                modalTab === "group" ? "primary-button" : "secondary-button"
              }
              onClick={() => setModalTab("group")}
              style={{ flex: 1 }}
            >
              <Users size={16} style={{ display: "inline", marginRight: 4 }} />
              Create Group
            </button>
          )}
        </div>

        {/* Direct Message tab */}
        {modalTab === "direct" && (
          <div className="form-stack">
            <label>Select a user to chat with</label>

            {chatUsers.length === 0 ? (
              <p>No users available</p>
            ) : (
              chatUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleStartDirect(u.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    cursor: "pointer",
                    borderRadius: "8px",
                    marginBottom: "4px",
                    border: "1px solid var(--border-color, #e2e2e2)",
                  }}
                >
                  <div className="sidebar-avatar">
                    {u.fullName?.charAt(0)}
                  </div>
                  <div>
                    <strong>{u.fullName}</strong>
                    <small style={{ display: "block" }}>
                      {u.email}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Group tab — ADMIN only */}
        {modalTab === "group" && isAdmin && (
          <form className="form-stack" onSubmit={handleCreateGroup}>
            <label>Group Name *</label>
            <input
              type="text"
              placeholder="e.g. Project Alpha Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />

            <label>
              Select Members * ({selectedMembers.length} selected)
            </label>

            <div
              style={{
                maxHeight: "240px",
                overflowY: "auto",
                padding: "8px",
                border: "1px solid var(--border-color, #e2e2e2)",
                borderRadius: "8px",
              }}
            >
              {chatUsers.length === 0 ? (
                <p>No users available</p>
              ) : (
                chatUsers.map((u) => (
                  <label
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      padding: "6px",
                      borderRadius: "6px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(u.id)}
                      onChange={() => toggleMember(u.id)}
                    />
                    <div className="sidebar-avatar">
                      {u.fullName?.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: "14px" }}>
                        {u.fullName}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          opacity: 0.6,
                        }}
                      >
                        {u.email}
                      </small>
                    </div>
                  </label>
                ))
              )}
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={creatingGroup}
            >
              {creatingGroup ? "Creating..." : "Create Group"}
            </button>
          </form>
        )}
      </Modal>

      {/* ─── Rename group modal (ADMIN) ─────────────────────────── */}
      <Modal
        open={showGroupModal === "rename"}
        onClose={() => setShowGroupModal("")}
        title="Rename Group"
      >
        <form className="form-stack" onSubmit={handleUpdateGroup}>
          <label>Group Name</label>
          <input
            type="text"
            value={editGroupName}
            onChange={(e) => setEditGroupName(e.target.value)}
            required
          />
          <button className="primary-button" type="submit">
            Save Changes
          </button>
        </form>
      </Modal>

      {/* ─── Add member modal (ADMIN / MANAGER) ─────────────────── */}
      <Modal
        open={showGroupModal === "addMember"}
        onClose={() => setShowGroupModal("")}
        title="Add Member to Group"
      >
        <form className="form-stack" onSubmit={handleAddMember}>
          <label>Select user to add</label>

          {availableUsers.length === 0 ? (
            <p>All users are already in this group.</p>
          ) : (
            <select
              value={addMemberId}
              onChange={(e) => setAddMemberId(e.target.value)}
              required
            >
              <option value="">Select a user</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          )}

          <button className="primary-button" type="submit">
            <UserPlus size={16} style={{ display: "inline", marginRight: 4 }} />
            Add Member
          </button>
        </form>
      </Modal>

      {/* ─── Manage members modal (ADMIN / MANAGER) ─────────────── */}
      <Modal
        open={showGroupModal === "members"}
        onClose={() => setShowGroupModal("")}
        title={`Members (${selectedConv?.members?.length || 0})`}
      >
        <div className="form-stack">
          {selectedConv?.members?.map((member) => (
            <div
              key={member.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "8px",
                marginBottom: "4px",
                border: "1px solid var(--border-color, #e2e2e2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="sidebar-avatar">
                  {member.user?.fullName?.charAt(0)}
                </div>
                <div>
                  <strong>{member.user?.fullName}</strong>
                  <small style={{ display: "block", opacity: 0.6 }}>
                    {member.user?.email}
                  </small>
                </div>
              </div>

              {canManageGroups && member.userId !== user?.id && (
                <button
                  className="icon-button danger"
                  title="Remove member"
                  onClick={() => handleRemoveMember(member.userId)}
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))}

          {(!selectedConv?.members || selectedConv.members.length === 0) && (
            <p>No members in this group.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
