import api from "./api";

export const progressService = {
  getProgress: async () => {
    const response = await api.get("/progress");
    return response.data;
  },

  createProgress: async (progressData) => {
    const response = await api.post("/progress", progressData);
    return response.data;
  },

  updateProgress: async (id, progressData) => {
    const response = await api.put(`/progress/${id}`, progressData);
    return response.data;
  },

  deleteProgress: async (id) => {
    const response = await api.delete(`/progress/${id}`);
    return response.data;
  },
};

