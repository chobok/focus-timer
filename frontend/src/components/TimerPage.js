import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";

const FOCUS_LEN = 25 * 60;
const BREAK_LEN = 5 * 60;
const STORAGE_KEY = "focus-tracker-timer-state";

function pad(n) {
  return n.toString().padStart(2, "0");
}
function fmt(sec) {
  return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function TimerPage() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const saved = loadState();
  const [phase, setPhase] = useState(saved?.phase || "focus");
  const [secondsLeft, setSecondsLeft] = useState(saved?.secondsLeft ?? FOCUS_LEN);
  const [running, setRunning] = useState(saved?.running ?? false);
  const intervalRef = useRef(null);

  useEffect(() => {
    api
      .getSubjects()
      .then((data) => {
        setSubjects(data);
        if (!activeSubject && data.length) setActiveSubject(saved?.activeSubject || data[0].id);
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ phase, secondsLeft, running, activeSubject })
    );
  }, [phase, secondsLeft, running, activeSubject]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // 오디오 컨텍스트를 사용할 수 없는 환경에서는 무시
    }
  }, []);

  const handlePhaseComplete = useCallback(() => {
    playBeep();
    if (phase === "focus") {
      if (activeSubject) {
        api
          .createSession(activeSubject, 25)
          .catch((e) => setError(e.message));
      }
      showToast("집중 세션 완료! 5분 휴식을 시작합니다.");
      setPhase("break");
      setSecondsLeft(BREAK_LEN);
      setRunning(true);
    } else {
      showToast("휴식 완료! 다음 세션을 시작해보세요.");
      setPhase("focus");
      setSecondsLeft(FOCUS_LEN);
      setRunning(false);
    }
  }, [phase, activeSubject, showToast]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, handlePhaseComplete]);

  function toggleRun() {
    setRunning((r) => !r);
  }
  function resetTimer() {
    setRunning(false);
    setPhase("focus");
    setSecondsLeft(FOCUS_LEN);
  }

  async function addSubject() {
    const name = newSubjectName.trim();
    if (!name) return;
    try {
      const created = await api.createSubject(name);
      setSubjects((prev) => [...prev, created]);
      setActiveSubject((prev) => prev ?? created.id);
      setNewSubjectName("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeSubject(id) {
    try {
      await api.deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      if (activeSubject === id) {
        const remaining = subjects.filter((s) => s.id !== id);
        setActiveSubject(remaining.length ? remaining[0].id : null);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  const total = phase === "focus" ? FOCUS_LEN : BREAK_LEN;
  const progress = 1 - secondsLeft / total;
  const r = 120,
    c = 2 * Math.PI * r;
  const activeName = subjects.find((s) => s.id === activeSubject);

  return (
    <div className="card timer-wrap">
      {error && <div className="error">{error}</div>}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "var(--panel2)",
            border: "1px solid var(--accent)",
            padding: "14px 20px",
            borderRadius: 10,
            fontSize: 14,
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}

      <div className="timer-phase">
        {phase === "focus" ? "집중 세션" : "휴식 시간"}
        {activeName ? ` · ${activeName.name}` : ""}
      </div>
      <div className="timer-ring">
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={r} stroke="var(--border)" strokeWidth="14" fill="none" />
          <circle
            cx="140"
            cy="140"
            r={r}
            stroke={phase === "focus" ? "var(--accent)" : "#5ec8a8"}
            strokeWidth="14"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            strokeLinecap="round"
            transform="rotate(-90 140 140)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="timer-time">{fmt(secondsLeft)}</div>
      </div>
      <div className="timer-controls">
        <button className="btn primary" onClick={toggleRun} disabled={!activeSubject}>
          {running ? "일시정지" : "시작"}
        </button>
        <button className="btn" onClick={resetTimer}>
          리셋
        </button>
      </div>
      {!activeSubject && (
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 10 }}>
          먼저 과목을 추가하고 선택해주세요.
        </div>
      )}

      <div style={{ marginTop: 40, width: "100%" }}>
        <div className="section-title" style={{ textAlign: "center" }}>
          과목 선택
        </div>
        <div className="subject-row">
          {subjects.length === 0 ? (
            <div className="empty" style={{ padding: "8px 0" }}>
              아직 과목이 없습니다. 아래에서 첫 과목을 추가해보세요.
            </div>
          ) : (
            subjects.map((s) => (
              <span
                key={s.id}
                className={"chip" + (activeSubject === s.id ? " active" : "")}
                onClick={() => !running && setActiveSubject(s.id)}
              >
                {s.name}
                <span
                  className="x"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSubject(s.id);
                  }}
                >
                  ✕
                </span>
              </span>
            ))
          )}
        </div>
        <div className="add-subject" style={{ justifyContent: "center" }}>
          <input
            placeholder="새 과목 이름"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubject()}
            style={{ width: 160 }}
          />
          <button className="btn" onClick={addSubject}>
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
