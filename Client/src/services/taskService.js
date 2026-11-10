
import api from "../api/axios";

const taskService = {
  getTasks: async () => {
    const response = await api.get("/tasks");
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
};

export default taskService;
