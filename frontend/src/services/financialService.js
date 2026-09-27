import api from "./api";

export const financialService = {
  getAdminDashboardFinancials: async () => {
    const response = await api.get("/financials/admin-dashboard");
    return response.data;
  },

  getEngineerDashboardFinancials: async () => {
    const response = await api.get("/financials/engineer-dashboard");
    return response.data;
  },

  getPaymentAudit: async () => {
    const response = await api.get("/financials/payment-audit");
    return response.data;
  }
};

