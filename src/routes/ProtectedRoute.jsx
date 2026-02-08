// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../storage/auth/AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthed, initializing } = useAuth();

  // DEV-ONLY auth bypass
  const bypass =
    import.meta.env.DEV &&
    String(import.meta.env.VITE_AUTH_BYPASS) === "true";

  // If bypass enabled → allow everything
  if (bypass) {
    return <Outlet />;
  }

  // Normal auth flow
  if (initializing) {
    return (
      <div className="min-h-screen bg-th-surface text-th-text-sub p-6">
        Loading…
      </div>
    );
  }

  return isAuthed ? <Outlet /> : <Navigate to="/auth" replace />;
}
