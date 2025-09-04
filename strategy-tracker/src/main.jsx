// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/strategy/1/account/1" replace />} />
      <Route path="/strategy/:strategyId/account/:accountId" element={<App />} />
    </Routes>
  </BrowserRouter>
);
