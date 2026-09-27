import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("smartConstructionToken") || null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem("smartConstructionToken");
      const savedUserStr = localStorage.getItem("smartConstructionUser");

      if (savedToken && savedUserStr) {
        try {
          const user = JSON.parse(savedUserStr);
          if (user && user.id) {
            const profileRes = await authService.getProfile(user.id);
            if (profileRes.success && profileRes.user) {
              const freshUser = profileRes.user;
              setCurrentUser(freshUser);
              setRole(freshUser.role);
              setToken(savedToken);
              localStorage.setItem("smartConstructionUser", JSON.stringify(freshUser));
            } else {
              handleLogout();
            }
          } else {
            handleLogout();
          }
        } catch (err) {
          console.warn("Auth initialization fallback:", err.message);
          try {
            const user = JSON.parse(savedUserStr);
            setCurrentUser(user);
            setRole(user.role);
            setToken(savedToken);
          } catch (_) {
            handleLogout();
          }
        }
      } else {
        handleLogout();
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const completeAuth = (data) => {
    if (data.success && data.token && data.user) {
      localStorage.setItem("smartConstructionToken", data.token);
      localStorage.setItem("smartConstructionUser", JSON.stringify(data.user));
      localStorage.setItem("isLoggedIn", "true");
      sessionStorage.removeItem("smartConstructionMfaSession");

      setToken(data.token);
      setCurrentUser(data.user);
      setRole(data.user.role);
      return data;
    }
    throw new Error("Invalid authentication payload");
  };

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (!data.success) {
      throw new Error(data.error || "Login failed");
    }

    // Check if MFA is required or setup required
    if (data.mfaRequired || data.mfaSetupRequired) {
      sessionStorage.setItem("smartConstructionMfaSession", JSON.stringify(data));
      return data;
    }

    // Direct login without MFA (e.g. if MFA is disabled)
    if (data.token && data.user) {
      return completeAuth(data);
    }

    return data;
  };

  const handleLogout = () => {
    authService.logout();
    setToken(null);
    setCurrentUser(null);
    setRole(null);
  };

  const updateUser = (updatedFields) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("smartConstructionUser", JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    currentUser,
    token,
    role,
    isAuthenticated: Boolean(token && currentUser),
    loading,
    login,
    completeAuth,
    logout: handleLogout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
