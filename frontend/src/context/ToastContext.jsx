import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title, message, duration) => {
    addToast(title, message, "success", duration);
  }, [addToast]);

  const error = useCallback((title, message, duration) => {
    addToast(title, message, "error", duration);
  }, [addToast]);

  const warning = useCallback((title, message, duration) => {
    addToast(title, message, "warning", duration);
  }, [addToast]);

  const info = useCallback((title, message, duration) => {
    addToast(title, message, "info", duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="app-toast-container">
        {toasts.map((toast) => {
          let icon = "bi-info-circle-fill";
          if (toast.type === "success") icon = "bi-check-circle-fill";
          if (toast.type === "error") icon = "bi-x-circle-fill";
          if (toast.type === "warning") icon = "bi-exclamation-triangle-fill";

          return (
            <div key={toast.id} className={`app-toast toast-${toast.type}`}>
              <i className={`bi ${icon} fs-5 text-${toast.type === "success" ? "success" : toast.type === "error" ? "danger" : toast.type === "warning" ? "warning" : "info"}`}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-navy)" }}>
                  {toast.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-sm"
                style={{ fontSize: "10px" }}
                onClick={() => removeToast(toast.id)}
              ></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

