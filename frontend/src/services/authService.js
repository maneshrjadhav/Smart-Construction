import api from "./api";

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  mfaGenerate: async (mfaSessionToken) => {
    const response = await api.post("/auth/mfa/generate", { mfaSessionToken });
    return response.data;
  },

  mfaVerifySetup: async (setupToken, code) => {
    const response = await api.post("/auth/mfa/verify-setup", { setupToken, code });
    return response.data;
  },

  mfaVerify: async (mfaSessionToken, code) => {
    const response = await api.post("/auth/mfa/verify", { mfaSessionToken, code });
    return response.data;
  },

  mfaVerifyRecovery: async (mfaSessionToken, recoveryCode) => {
    const response = await api.post("/auth/mfa/verify-recovery", { mfaSessionToken, recoveryCode });
    return response.data;
  },

  mfaSkipSetup: async (mfaSessionToken) => {
    const response = await api.post("/auth/mfa/skip-setup", { mfaSessionToken });
    return response.data;
  },

  mfaGetStatus: async () => {
    const response = await api.get("/auth/mfa/status");
    return response.data;
  },

  mfaDisable: async (password) => {
    const response = await api.post("/auth/mfa/disable", { password });
    return response.data;
  },

  mfaRegenerateRecovery: async (password, code) => {
    const response = await api.post("/auth/mfa/regenerate-recovery", { password, code });
    return response.data;
  },

  getProfile: async (userId) => {
    const response = await api.get(`/auth/profile/${userId}`);
    return response.data;
  },

  changePassword: async (userId, data) => {
    const response = await api.put(`/auth/change-password/${userId}`, data);
    return response.data;
  },

  firstLoginChangePassword: async (passwordData) => {
    const response = await api.post("/auth/first-login-change-password", passwordData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("smartConstructionToken");
    localStorage.removeItem("smartConstructionUser");
    localStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("smartConstructionMfaSession");
  },
};
