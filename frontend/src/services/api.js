import axios from "axios";

// In development with Vite proxy or production with Express/tunnel, relative '/api' is used
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("smartConstructionToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Pass user role header for backward compatibility
    const userJson = localStorage.getItem("smartConstructionUser");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user && user.role) {
          config.headers["x-user-role"] = user.role;
        }
      } catch (_) {}
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or unauthorized and not on login page
      if (
        !window.location.pathname.includes("/login") &&
        window.location.pathname !== "/"
      ) {
        localStorage.removeItem("smartConstructionToken");
        localStorage.removeItem("smartConstructionUser");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

