import api from "./api";

export const payrollService = {
  getPayroll: async () => {
    const response = await api.get("/payroll");
    return response.data;
  },

  createPayroll: async (payrollData) => {
    const response = await api.post("/payroll", payrollData);
    return response.data;
  },

  updatePayroll: async (id, payrollData) => {
    const response = await api.put(`/payroll/${id}`, payrollData);
    return response.data;
  },

  deletePayroll: async (id) => {
    const response = await api.delete(`/payroll/${id}`);
    return response.data;
  },
};

