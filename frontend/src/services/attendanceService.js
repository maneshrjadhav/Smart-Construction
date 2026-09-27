import api from "./api";

export const attendanceService = {
  getAttendance: async () => {
    const response = await api.get("/attendance");
    return response.data;
  },

  saveAttendance: async (attendanceData) => {
    const response = await api.post("/attendance", attendanceData);
    return response.data;
  },
};

