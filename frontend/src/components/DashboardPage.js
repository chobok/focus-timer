import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "../api";

const SUBJECT_COLORS = {
  Work: "#ff7a59",
  Reading: "#5ec8a8",
  Exercise: "#f0c33c",
  Study: "#7a9bff",
  Other: "#b388ff",
};
const PALETTE = ["#ff7a59", "#5ec8a8", "#f0c33c", "#7a9bff", "#b388ff", "#5ecbe6", "#e6815e"];
function colorFor(name, idx) {
  return SUBJECT_COLORS[name] || PALETTE[idx % PALETTE.length];
}

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="card error">{error}</div>;
  if (!stats) return <div className="card empty">불러오는 중...</div>;

  const byWeekday = WEEKDAY_ORDER.map((day) => ({
    day,
    minutes: stats.by_weekday?.[day] || 0,
  }));

  return (
    <div>
      <div className="grid cols-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="stat-label">연속 기록</div>
          <div className="streak-badge">
            <span className="streak-num">{stats.streak}</span>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>일</span>
          </div>
        </div>
        <div className="card">
          <div className="stat-label">총 집중 시간</div>
          <div className="stat-value">{stats.total_hours}h</div>
        </div>
        <div className="card">
          <div className="stat-label">이번 주 세션</div>
          <div className="stat-value">{stats.sessions_this_week}</div>
        </div>
        <div className="card">
          <div className="stat-label">과목 수</div>
          <div className="stat-value">{stats.by_subject?.length || 0}</div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>과목별 집중 시간 (분)</h3>
          {!stats.by_subject || stats.by_subject.length === 0 ? (
            <div className="empty">데이터 없음</div>
          ) : (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_subject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#34343d" vertical={false} />
                  <XAxis dataKey="name" stroke="#9a9aa3" fontSize={12} />
                  <YAxis stroke="#9a9aa3" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#23232a",
                      border: "1px solid #34343d",
                      borderRadius: 8,
                      color: "#f2f1ee",
                    }}
                  />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                    {stats.by_subject.map((entry, i) => (
                      <Cell key={i} fill={colorFor(entry.name, i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>주간 패턴 (월~일, 분)</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byWeekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#34343d" vertical={false} />
                <XAxis dataKey="day" stroke="#9a9aa3" fontSize={12} />
                <YAxis stroke="#9a9aa3" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#23232a",
                    border: "1px solid #34343d",
                    borderRadius: 8,
                    color: "#f2f1ee",
                  }}
                />
                <Bar dataKey="minutes" fill="#ff7a59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
