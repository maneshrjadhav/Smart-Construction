import api from "./api";

export const paymentService = {
  // Worker Payments
  getWorkerPayments: async (params = {}) => {
    const response = await api.get("/payments/worker-payments", { params });
    return response.data;
  },

  recordWorkerPayment: async (paymentData) => {
    const response = await api.post("/payments/worker-payments", paymentData);
    return response.data;
  },

  getPaymentSummary: async () => {
    const response = await api.get("/payments/summary");
    return response.data;
  },

  // Engineer Allocations
  getAllocations: async () => {
    const response = await api.get("/allocations");
    return response.data;
  },

  createAllocation: async (data) => {
    const response = await api.post("/allocations", data);
    return response.data;
  },

  updateAllocation: async (id, data) => {
    const response = await api.put(`/allocations/${id}`, data);
    return response.data;
  }
};

