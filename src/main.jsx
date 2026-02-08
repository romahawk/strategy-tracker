// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import HomeRedirect from "./routes/HomeRedirect.jsx";
import StrategyAccountGuard from "./routes/StrategyAccountGuard.jsx";

// Auth
import AuthPage from "./routes/AuthPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./storage/auth/AuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

// NEW
import AccountsPage from "./routes/AccountsPage.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeRedirect />} />

            <Route
              path="/strategy/:strategyId/account/:accountId"
              element={<StrategyAccountGuard />}
            >
              <Route index element={<App />} />
              <Route path="accounts" element={<AccountsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
