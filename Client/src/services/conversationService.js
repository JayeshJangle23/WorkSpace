import api from "../api/axios";

const conversationService = {
  getConversations: async () => {
    const response = await api.get("/conversations");
    return response.data;
  },

  getUsersForChat: async () => {
    const response = await api.get("/conversations/users");
    return response.data;
  },

  createDirectConversation: async (targetUserId) => {
    const response = await api.post("/conversations/direct", {
      targetUserId,
    });
    return response.data;
  },

  createGroupConversation: async (name, memberIds) => {
    const response = await api.post("/conversations/group", {
      name,
      memberIds,
    });
    return response.data;
  },

  updateGroupConversation: async (conversationId, name) => {
    const response = await api.patch(
      `/conversations/group/${conversationId}`,
      { name }
    );
    return response.data;
  },

  deleteGroupConversation: async (conversationId) => {
    const response = await api.delete(
      `/conversations/group/${conversationId}`
    );
    return response.data;
  },

  addGroupMember: async (conversationId, userId) => {
    const response = await api.post(
      `/conversations/group/${conversationId}/members`,
      { userId }
    );
    return response.data;
  },

  removeGroupMember: async (conversationId, userId) => {
    const response = await api.delete(
      `/conversations/group/${conversationId}/members/${userId}`
    );
    return response.data;
  },

  getTeamConversation: async (teamId) => {
    const response = await api.get(`/conversations/team/${teamId}`);
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await api.get(
      `/conversations/${conversationId}/messages`
    );
    return response.data;
  },

  sendMessage: async (conversationId, content) => {
    const response = await api.post(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },

  markAsRead: async (conversationId) => {
    const response = await api.patch(
      `/conversations/${conversationId}/read`
    );
    return response.data;
  },

  deleteMessage: async (conversationId, messageId) => {
    const response = await api.delete(
      `/conversations/${conversationId}/messages/${messageId}`
    );
    return response.data;
  },
};

export default conversationService;
