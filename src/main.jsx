// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import HomeRedirect from "./routes/HomeRedirect.jsx";
import StrategyAccountGuard from "./routes/StrategyAccountGuard.jsx";

// NEW
import AuthPage from "./routes/AuthPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./storage/auth/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            {/* Dynamic home redirect (keep your current logic) */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Guarded strategy/account route */}
            <Route
              path="/strategy/:strategyId/account/:accountId"
              element={<StrategyAccountGuard />}
            >
              <Route index element={<App />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
