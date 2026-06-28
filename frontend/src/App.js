import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import TimerPage from "./components/TimerPage";
import HistoryPage from "./components/HistoryPage";
import DashboardPage from "./components/DashboardPage";

export default function App() {
  return (
    <div className="app">
      <div className="topnav">
        <div className="brand">
          <div className="dot"></div>
          <span>Focus Tracker</span>
        </div>
        <nav>
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Timer
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? "active" : "")}>
            History
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<TimerPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </div>
  );
}
