import api from "./api";

export const workerService = {
  getWorkers: async () => {
    const response = await api.get("/workers");
    return response.data;
  },

  getWorker: async (id) => {
    const response = await api.get(`/workers/${id}`);
    return response.data;
  },

  createWorker: async (workerData) => {
    const response = await api.post("/workers", workerData);
    return response.data;
  },

  updateWorker: async (id, workerData) => {
    const response = await api.put(`/workers/${id}`, workerData);
    return response.data;
  },

  deleteWorker: async (id) => {
    const response = await api.delete(`/workers/${id}`);
    return response.data;
  },

  uploadDocument: async (workerId, docData) => {
    const response = await api.post(`/workers/${workerId}/documents`, docData);
    return response.data;
  },

  getDocuments: async (workerId) => {
    const response = await api.get(`/workers/${workerId}/documents`);
    return response.data;
  },

  deleteDocument: async (workerId, docId) => {
    const response = await api.delete(`/workers/${workerId}/documents/${docId}`);
    return response.data;
  },

  getWorkHistory: async (workerId) => {
    const response = await api.get(`/workers/${workerId}/work-history`);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/workers/me");
    return response.data;
  },

  getMyAttendance: async () => {
    const response = await api.get("/workers/me/attendance");
    return response.data;
  },

  getMyPayments: async () => {
    const response = await api.get("/workers/me/payments");
    return response.data;
  },

  getMyWorkHistory: async () => {
    const response = await api.get("/workers/me/work-history");
    return response.data;
  },

  getMyDocuments: async () => {
    const response = await api.get("/workers/me/documents");
    return response.data;
  },

  getMyTasks: async () => {
    const response = await api.get("/workers/me/tasks");
    return response.data;
  },

  getMyNotifications: async () => {
    const response = await api.get("/workers/me/notifications");
    return response.data;
  },

  getMyProject: async () => {
    const response = await api.get("/workers/me/project");
    return response.data;
  },

  getMyEngineer: async () => {
    const response = await api.get("/workers/me/engineer");
    return response.data;
  }
};
