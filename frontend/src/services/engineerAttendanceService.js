import api from "./api";

export const engineerAttendanceService = {
  /**
   * Get attendance records (scoped by role automatically on server)
   * @param {Object} params - Query params (engineer_id, project_id, date, status)
   */
  getAttendance: async (params = {}) => {
    const response = await api.get("/engineer-attendance", { params });
    return response.data;
  },

  /**
   * Get today's attendance status for current engineer
   */
  getToday: async () => {
    const response = await api.get("/engineer-attendance/today");
    return response.data;
  },

  /**
   * Mark attendance for current engineer
   * @param {Object} data - { status, date, check_in, check_out, working_hours, remarks }
   */
  markAttendance: async (data) => {
    const response = await api.post("/engineer-attendance", data);
    return response.data;
  }
};

