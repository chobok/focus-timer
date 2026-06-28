import React, { useState, useEffect, useCallback } from "react";
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

export default function HistoryPage() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState("week");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch((e) => setError(e.message));
  }, []);

  const loadSessions = useCallback(() => {
    api
      .getSessions({
        subjectId: subjectFilter === "all" ? undefined : subjectFilter,
        range: rangeFilter,
      })
      .then(setSessions)
      .catch((e) => setError(e.message));
  }, [subjectFilter, rangeFilter]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function deleteSession(id) {
    try {
      await api.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 18 }}>집중 세션 기록</h2>
      {error && <div className="error">{error}</div>}
      <div className="filters">
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="all">전체 과목</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)}>
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="all">전체</option>
        </select>
      </div>
      {sessions.length === 0 ? (
        <div className="empty">아직 기록된 세션이 없습니다. Timer 탭에서 첫 세션을 완료해보세요.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>과목</th>
              <th>시간</th>
              <th>날짜</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const d = new Date(s.created_at);
              return (
                <tr key={s.id}>
                  <td>
                    <span className="tag">
                      <span className="sw" style={{ background: colorFor(s.subject_name, i) }}></span>
                      {s.subject_name}
                    </span>
                  </td>
                  <td>{s.duration}분</td>
                  <td>
                    {d.toLocaleDateString("ko-KR")}{" "}
                    {d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <button className="del" onClick={() => deleteSession(s.id)}>
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
