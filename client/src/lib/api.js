// api.js — the browser's only channel to data. Everything goes through our own
// /api/* routes; no external API keys ever touch the client.
import { auth, firebaseConfigured } from "./firebase.js";

// Attach the current user's Firebase ID token to every same-origin /api request.
// Firebase refreshes/caches the token internally; we never store it ourselves.
async function afetch(url, options = {}) {
  const opts = { ...options };
  opts.headers = { ...(options.headers || {}) };
  try {
    if (firebaseConfigured && auth && auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) opts.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* no token available; request proceeds and protected routes 401 */ }
  return fetch(url, opts);
}

const j = async (r) => {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.message || `Request failed (${r.status})`), { payload: data, status: r.status });
  return data;
};

export const api = {
  health: () => afetch("/api/health").then(j),

  searchColleges: (params) => {
    const q = new URLSearchParams(params).toString();
    return afetch(`/api/colleges/search?${q}`).then(j);
  },
  byState: (state, page = 0) => afetch(`/api/colleges/by-state?state=${state}&page=${page}`).then(j),
  college: (id) => afetch(`/api/colleges/${id}`).then(j),
  cultureFit: (id, profile) =>
    afetch(`/api/colleges/${id}/fit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
    }).then(j),
  majorStrategy: (id, interests) =>
    afetch(`/api/colleges/${id}/major-strategy?interests=${encodeURIComponent((interests || []).join(","))}`).then(j),
  simLevers: () => afetch(`/api/colleges/simulator/levers`).then(j),
  topStem: (limit = 30) => afetch(`/api/colleges/top-stem?limit=${limit}`).then(j),
  topStemFit: (profile, limit = 30) =>
    afetch(`/api/colleges/top-stem/fit?limit=${limit}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
    }).then(j),
  simulate: (id, profile, levers) =>
    afetch(`/api/colleges/${id}/simulate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile, levers }),
    }).then(j),
  recommend: (profile, filters, includeServiceAcademies = false) =>
    afetch("/api/colleges/recommend", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, filters, includeServiceAcademies }),
    }).then(j),
  scoreOne: (profile, collegeId) =>
    afetch("/api/colleges/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, collegeId }),
    }).then(j),

  majors: () => afetch("/api/careers/majors").then(j),
  major: (name) => afetch(`/api/careers/major/${encodeURIComponent(name)}`).then(j),

  saveStudent: (id, p) =>
    afetch(`/api/students/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
    }).then(j),
  getStudent: (id) => afetch(`/api/students/${id}`).then(j),
  getList: (id) => afetch(`/api/students/${id}/list`).then(j),
  saveListItem: (id, collegeId, b) =>
    afetch(`/api/students/${id}/list/${collegeId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
    }).then(j),
  removeListItem: (id, collegeId) =>
    afetch(`/api/students/${id}/list/${collegeId}`, { method: "DELETE" }).then(j),
  getTracker: (id) => afetch(`/api/students/${id}/tracker`).then(j),
  saveTracker: (id, collegeId, b) =>
    afetch(`/api/students/${id}/tracker/${collegeId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
    }).then(j),

  advisor: (question, profile, recommendations) => {
    // Send ONLY the fields the advisor reads. The full scored list is several
    // megabytes and exceeds the server's request-size limit (HTTP 413).
    const slim = (recommendations || []).map((r) => ({
      college: {
        name: r.college?.name,
        state: r.college?.state,
        admissionRate: r.college?.admissionRate,
        satMidpoint: r.college?.satMidpoint,
      },
      admission: { category: r.admission?.category },
      netCost: r.netCost,
      overall: r.overall,
    }));
    return afetch("/api/advisor/ask", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, profile, recommendations: slim }),
    }).then(j);
  },

  listDocuments: (id) => afetch(`/api/documents/${id}`).then(j),
  uploadDocument: (id, kind, file) => {
    const fd = new FormData();
    fd.append("kind", kind); fd.append("file", file);
    return afetch(`/api/documents/${id}`, { method: "POST", body: fd }).then(j);
  },
  parseDocument: (id, docId) => afetch(`/api/documents/${id}/${docId}/parse`, { method: "POST" }).then(j),
  deleteDocument: (id, docId) => afetch(`/api/documents/${id}/${docId}`, { method: "DELETE" }).then(j),
  addPortfolioLink: (id, url) =>
    afetch(`/api/documents/${id}/link`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }),
    }).then(j),
  buildProfileFromDocs: (id) => afetch(`/api/documents/${id}/build-profile`, { method: "POST" }).then(j),
  programs: (id) => afetch(`/api/colleges/${id}/programs`).then(j),
  similarColleges: (id) => afetch(`/api/colleges/${id}/similar`).then(j),
  recommendMajors: (profile) =>
    afetch("/api/careers/recommend-majors", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
    }).then(j),
  strategy: (id, profile) =>
    afetch(`/api/students/${id}/strategy`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
    }).then(j),
  aidPlan: (id, profile) =>
    afetch(`/api/students/${id}/aid-plan`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
    }).then(j),
  listScholarships: (id) => afetch(`/api/students/${id}/scholarships`).then(j),
  saveScholarship: (id, sid, data) =>
    afetch(`/api/students/${id}/scholarships/${sid}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(j),
  deleteScholarship: (id, sid) => afetch(`/api/students/${id}/scholarships/${sid}`, { method: "DELETE" }).then(j),
  collegesByMajor: (major, state) => afetch(`/api/colleges/by-major?major=${encodeURIComponent(major)}${state ? `&state=${encodeURIComponent(state)}` : ""}`).then(j),
  collegeMajorCombos: (major1, major2, state) => afetch(`/api/colleges/major-combos?major1=${encodeURIComponent(major1)}${major2 ? `&major2=${encodeURIComponent(major2)}` : ""}${state ? `&state=${encodeURIComponent(state)}` : ""}`).then(j),
  collegeDeadlines: (id) => afetch(`/api/colleges/${id}/deadlines`).then(j),
  browseColleges: ({ name, state, control, major, page = 0, perPage = 25 }) => {
    const q = new URLSearchParams();
    if (name) q.set("name", name);
    if (state) q.set("state", state);
    if (control && control !== "all") q.set("control", control);
    if (major) q.set("major", major);
    q.set("page", String(page)); q.set("perPage", String(perPage));
    return afetch(`/api/colleges/browse?${q}`).then(j);
  },
  evaluateCollege: (id, profile) =>
    afetch(`/api/colleges/${id}/evaluate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
    }).then(j),
  topList: (kind, profile, limit = 30) =>
    afetch(`/api/colleges/top-list/${kind}?limit=${limit}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
    }).then(j),
  balancedList: (profile, size, filters, scenario, includeServiceAcademies = false) =>
    afetch("/api/colleges/balanced-list", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, size, filters, scenario, includeServiceAcademies }),
    }).then(j),
  bestFit: (profile, size, filters, scenario, includeServiceAcademies = false) =>
    afetch("/api/colleges/best-fit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, size, filters, scenario, includeServiceAcademies }),
    }).then(j),
  scenarios: () => afetch("/api/colleges/scenarios").then(j),
  evaluateWithScenario: (id, profile, scenario) =>
    afetch(`/api/colleges/${id}/evaluate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile, scenario }),
    }).then(j),
};
