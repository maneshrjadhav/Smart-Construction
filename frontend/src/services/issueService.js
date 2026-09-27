import api from "./api";

export const issueService = {
  getIssues: async () => {
    const response = await api.get("/issues");
    return response.data;
  },

  createIssue: async (issueData) => {
    const response = await api.post("/issues", issueData);
    return response.data;
  },

  updateIssue: async (id, issueData) => {
    const response = await api.put(`/issues/${id}`, issueData);
    return response.data;
  },

  deleteIssue: async (id) => {
    const response = await api.delete(`/issues/${id}`);
    return response.data;
  },
};

