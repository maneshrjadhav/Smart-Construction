import api from "./api";

export const engineerService = {
  getEngineers: async () => {
    const response = await api.get("/engineers");
    return response.data;
  },

  getEngineerById: async (id) => {
    const response = await api.get(`/engineers/${id}`);
    return response.data;
  },

  createEngineer: async (engineerData) => {
    const response = await api.post("/engineers", engineerData);
    return response.data;
  },

  deleteEngineer: async (id) => {
    const response = await api.delete(`/engineers/${id}`);
    return response.data;
  },

  resendCredentials: async (id) => {
    const response = await api.post(`/engineers/${id}/resend-credentials`);
    return response.data;
  },
};

