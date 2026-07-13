// Tracker.jsx — the real process manager. Per-saved-college application status,
// deadlines (blank until you enter real dates), student + parent notes, and a
// CSV export. Persists to the backend DB.
import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { fmtUSD } from "./ui.jsx";

const STATUS = ["Considering", "Planning to apply", "In progress", "Submitted", "Accepted", "Waitlisted", "Denied", "Committed"];
const YN = ["", "Not started", "In progress", "Done", "N/A"];
const ROUNDS = ["", "ED", "ED II", "EA", "REA", "RD", "Rolling"];

const FIELDS = [
  ["application_round", "Round", "select", ROUNDS],
  ["application_deadline", "App deadline", "date"],
  ["scholarship_deadline", "Scholarship deadline", "date"],
  ["fafsa_deadline", "FAFSA deadline", "date"],
  ["css_deadline", "CSS deadline", "date"],
  ["transcript_status", "Transcript", "select", YN],
  ["recommendation_status", "Recommendations", "select", YN],
  ["essay_status", "Main essay", "select", YN],
  ["supplement_status", "Supplements", "select", YN],
  ["interview_status", "Interview", "select", YN],
  ["submitted_status", "Submitted", "select", YN],
  ["decision_status", "Decision", "select", ["", "Pending", "Accepted", "Waitlisted", "Denied"]],
  ["final_net_cost", "Final net cost", "number"],
];

export function Tracker({ studentId, list, collegeNames }) {
  const [rows, setRows] = useState({});
  const [open, setOpen] = useState(null);

  useEffect(() => {
    api.getTracker(studentId).then((r) => {
      const map = {};
      (r.tracker || []).forEach((t) => { map[t.college_id] = t; });
      setRows(map);
    }).catch(() => {});
  }, [studentId]);

  const update = (cid, field, value) => {
    setRows((s) => {
      const next = { ...(s[cid] || {}), [field]: value, college_name: collegeNames[cid] || (s[cid] && s[cid].college_name) || cid };
      const merged = { ...s, [cid]: next };
      api.saveTracker(studentId, cid, next).catch(() => {});
      return merged;
    });
  };

  const exportCsv = () => {
    const headers = ["College", ...FIELDS.map((f) => f[1]), "Student notes", "Parent notes"];
    const lines = [headers.join(",")];
    for (const item of list) {
      const cid = item.college_id;
      const r = rows[cid] || {};
      const cells = [collegeNames[cid] || (rows[cid] && rows[cid].college_name) || cid, ...FIELDS.map((f) => r[f[0]] ?? ""), r.student_notes ?? "", r.parent_notes ?? ""];
      lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "collegegene-application-tracker.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (!list.length) {
    return <div className="empty">Save colleges to your list first — then track applications here.</div>;
  }

  return (
    <div className="stack">
      <div className="row spread wrap">
        <div>
          <div className="eyebrow">Process tracker</div>
          <h1>Applications</h1>
          <p className="lead">Enter your real deadlines from each college’s official site. Everything saves automatically.</p>
        </div>
        <button className="btn ghost" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="disclaimer">Deadlines are blank until you enter them. Always confirm exact dates and required forms on each college’s official admissions and financial-aid pages.</div>

      <div className="stack">
        {list.map((item) => {
          const cid = item.college_id;
          const r = rows[cid] || {};
          const isOpen = open === cid;
          return (
            <div key={cid} className="card">
              <div className="pad row spread" style={{ cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : cid)}>
                <div>
                  <h3>{collegeNames[cid] || (rows[cid] && rows[cid].college_name) || cid}</h3>
                  <div className="note">{r.application_round || "No round set"} · {r.decision_status || "Decision pending"}</div>
                </div>
                <select className="inp" style={{ width: 180 }} value={r.status || item.status || "Considering"}
                  onClick={(e) => e.stopPropagation()} onChange={(e) => update(cid, "status", e.target.value)}>
                  {STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              {isOpen && (
                <div className="pad" style={{ borderTop: "1px solid var(--line-2)" }}>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>
                    {FIELDS.map(([key, label, type, opts]) => (
                      <div key={key}>
                        <label className="lbl">{label}</label>
                        {type === "select" ? (
                          <select className="inp" value={r[key] || ""} onChange={(e) => update(cid, key, e.target.value)}>
                            {opts.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
                          </select>
                        ) : (
                          <input className="inp" type={type} value={r[key] || ""} onChange={(e) => update(cid, key, e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid cols-2" style={{ marginTop: 14 }}>
                    <div>
                      <label className="lbl">Student notes</label>
                      <textarea className="inp" rows={3} value={r.student_notes || ""} onChange={(e) => update(cid, "student_notes", e.target.value)} placeholder="Why I like it, questions to ask, visit impressions…" />
                    </div>
                    <div>
                      <label className="lbl">Parent notes</label>
                      <textarea className="inp" rows={3} value={r.parent_notes || ""} onChange={(e) => update(cid, "parent_notes", e.target.value)} placeholder="Cost considerations, distance, family thoughts…" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
