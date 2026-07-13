// Dashboard.jsx — home overview: profile completeness, list balance, upcoming
// deadlines, and recommended next steps. Pulls together the whole app.
import React, { useMemo } from "react";
import { CategoryTag } from "./ui.jsx";

function completeness(p) {
  const checks = [
    ["Basics (state, grade)", !!p.state && !!p.grade],
    ["GPA", !!p.gpa],
    ["Test scores", !!p.sat || !!p.act],
    ["Course rigor / AP count", p.apCount != null],
    ["Intended majors", (p.interests || []).length > 0],
    ["Career goals", (p.careerGoals || []).length > 0],
    ["Budget", !!p.budget],
    ["Activities / experience", !!p.activitiesText || p.hasResearch || p.hasInternship || p.hasLeadership],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return { pct: Math.round((done / checks.length) * 100), checks };
}

export function Dashboard({ profile, saved, recs, onGo }) {
  const comp = useMemo(() => completeness(profile), [profile]);
  const byCat = useMemo(() => {
    const c = { Reach: 0, Target: 0, Safety: 0 };
    saved.forEach((s) => { if (c[s.category] != null) c[s.category]++; });
    return c;
  }, [saved]);

  // Balance guidance based on the saved list.
  const balanceNote = useMemo(() => {
    const total = saved.length;
    if (!total) return "You haven't saved any colleges yet. Generate matches and add a balanced set.";
    const tips = [];
    if (byCat.Safety < 2) tips.push("add 1–2 more safety schools you'd be happy to attend");
    if (byCat.Target < 3) tips.push("aim for 3–5 targets — they're the core of a strong list");
    if (byCat.Reach > 6) tips.push("you have a lot of reaches; make sure targets and safeties are solid");
    return tips.length ? "Suggestion: " + tips.join("; ") + "." : "Nice — your list looks reasonably balanced across reach, target, and safety.";
  }, [saved, byCat]);

  const nextSteps = useMemo(() => {
    const steps = [];
    if (comp.pct < 100) steps.push(["Complete your profile", "profile"]);
    if (!recs.length) steps.push(["Generate your college matches", "matches"]);
    if (saved.length < 5) steps.push(["Build a balanced list (aim ~8–12 colleges)", "matches"]);
    if (saved.length) steps.push(["Set deadlines & tasks in Applications", "applications"]);
    if (saved.length >= 2) steps.push(["Compare your top choices side by side", "saved"]);
    steps.push(["Explore majors that fit you", "majors"]);
    return steps.slice(0, 5);
  }, [comp.pct, recs.length, saved.length]);

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Dashboard</div>
        <h1>{profile.name ? `${profile.name}'s plan` : "Your college plan"}</h1>
        <p className="lead">Everything at a glance — your profile, your list balance, and what to do next.</p>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="n">{comp.pct}%</div><div className="l">Profile complete</div></div>
        <div className="kpi"><div className="n">{saved.length}</div><div className="l">Colleges saved</div></div>
        <div className="kpi"><div className="n" style={{ color: "var(--reach)" }}>{byCat.Reach}</div><div className="l">▲ Reach</div></div>
        <div className="kpi"><div className="n" style={{ color: "var(--target)" }}>{byCat.Target}</div><div className="l">◆ Target</div></div>
        <div className="kpi"><div className="n" style={{ color: "var(--safety)" }}>{byCat.Safety}</div><div className="l">● Safety</div></div>
      </div>

      <div className="grid cols-2">
        <div className="card pad stack">
          <h3>Recommended next steps</h3>
          {nextSteps.map(([label, view]) => (
            <button key={label} className="row spread" style={{ width: "100%", textAlign: "left", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }} onClick={() => onGo(view)}>
              <span>{label}</span><span style={{ color: "var(--amber)" }}>→</span>
            </button>
          ))}
        </div>

        <div className="card pad stack">
          <h3>Profile completeness</h3>
          {comp.checks.map(([label, ok]) => (
            <div key={label} className="row" style={{ gap: 8 }}>
              <span style={{ color: ok ? "var(--safety)" : "var(--muted)" }}>{ok ? "✓" : "○"}</span>
              <span className="note" style={{ color: ok ? "var(--ink-900)" : "var(--muted)" }}>{label}</span>
            </div>
          ))}
          {comp.pct < 100 && <button className="btn amber sm" style={{ marginTop: 8, alignSelf: "flex-start" }} onClick={() => onGo("profile")}>Finish profile →</button>}
        </div>
      </div>

      <div className="card pad stack">
        <div className="row spread">
          <h3>List balance</h3>
          <button className="btn ghost sm" onClick={() => onGo("saved")}>View my list →</button>
        </div>
        <p className="note">{balanceNote}</p>
        {saved.length > 0 && (
          <div className="row wrap" style={{ gap: 6 }}>
            {saved.slice(0, 8).map((s) => (
              <span key={s.college_id} className="pill" style={{ cursor: "default" }}>
                {s.college_name || s.college_id}{s.category ? ` · ${s.category}` : ""}
              </span>
            ))}
            {saved.length > 8 && <span className="note">+{saved.length - 8} more</span>}
          </div>
        )}
      </div>

      <div className="disclaimer">
        This dashboard summarizes your own entries and official data. Estimates aren't guarantees — confirm
        deadlines, costs, and requirements with each college's official site.
      </div>
    </div>
  );
}
