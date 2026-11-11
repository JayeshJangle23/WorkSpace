
import api from "../api/axios";

const taskService = {
  getTasks: async () => {
    const response = await api.get("/tasks");
    return response.data;
  },

  getTaskById: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (data) => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  updateTask: async (taskId, data) => {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  updateTaskStatus: async (taskId, status) => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  submitForReview: async (taskId) => {
    const response = await api.patch(`/tasks/${taskId}/submit-review`);
    return response.data;
  },

  reviewTask: async (taskId, reviewStatus, reviewNote) => {
    const response = await api.patch(`/tasks/${taskId}/review`, {
      reviewStatus,
      reviewNote,
    });
    return response.data;
  },

  getTeamMembers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  getComments: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  addComment: async (taskId, content) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  deleteComment: async (taskId, commentId) => {
    const response = await api.delete(
      `/tasks/${taskId}/comments/${commentId}`
    );
    return response.data;
  },
};

export default taskService;
