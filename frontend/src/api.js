const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getSubjects: () => request("/subjects"),
  createSubject: (name) =>
    request("/subjects", { method: "POST", body: JSON.stringify({ name }) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: "DELETE" }),

  getSessions: ({ subjectId, range } = {}) => {
    const params = new URLSearchParams();
    if (subjectId) params.set("subject_id", subjectId);
    if (range) params.set("range", range);
    const qs = params.toString();
    return request(`/sessions${qs ? `?${qs}` : ""}`);
  },
  createSession: (subjectId, duration) =>
    request("/sessions", {
      method: "POST",
      body: JSON.stringify({ subject_id: subjectId, duration }),
    }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: "DELETE" }),

  getStats: () => request("/stats"),
};
