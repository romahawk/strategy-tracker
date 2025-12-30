// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import HomeRedirect from "./routes/HomeRedirect.jsx";
import StrategyAccountGuard from "./routes/StrategyAccountGuard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* Dynamic home redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Guarded strategy/account route */}
      <Route
        path="/strategy/:strategyId/account/:accountId"
        element={<StrategyAccountGuard />}
      >
        <Route index element={<App />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
