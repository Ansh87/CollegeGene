// MatchCard.jsx — the single card style used by BOTH Balanced List and Best Fit.
// Score bars are collapsed by default so cards stay scannable.
import React from "react";
import { CategoryTag, Meter, SourceBadge, fmtUSD, fmtPct } from "./ui.jsx";

function ScoreRow({ label, value }) {
  return (
    <div className="row spread" style={{ gap: 10 }}>
      <span className="note" style={{ minWidth: 130 }}>{label}</span>
      <Meter value={value} />
      <span className="mono" style={{ fontSize: 12, minWidth: 28, textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}

export function MatchCard({ scored, saved, onOpen, onToggleSave }) {
  const c = scored.college || {};
  const subs = scored.subs || {};
  const mf = scored.majorFit;

  return (
    <div className="card pad">
      <div className="row spread" style={{ alignItems: "flex-start", gap: 10 }}>
        <div>
          <strong style={{ fontSize: 15 }}>{c.name}</strong>
          <div className="note" style={{ marginTop: 2 }}>
            {[c.city, c.state].filter(Boolean).join(", ")}
            {c.controlType ? ` · ${c.controlType}` : ""}
          </div>
        </div>
        {scored.admission && (
          <CategoryTag category={scored.coarseCategory || scored.admission.category}
            label={scored.admission.label} range={scored.admission.range} />
        )}
      </div>

      <div className="row wrap" style={{ gap: 6, margin: "12px 0" }}>
        <span className="pill">Fit {scored.overall ?? "—"}</span>
        <span className="pill">Admit {fmtPct(c.admissionRate) || "n/a"}</span>
        <span className="pill">Est. cost {fmtUSD(scored.netCost) || "n/a"}</span>
        {subs.major != null && <span className="pill">Major fit {subs.major}</span>}
        {scored.roi?.paybackYears != null && <span className="pill">ROI {scored.roi.paybackYears}y</span>}
      </div>

      {/* Major/career-track scenario fit (shown only when a scenario is active) */}
      {scored.scenario && (
        <div className="card pad" style={{ background: "var(--paper-2)", padding: "8px 10px", marginBottom: 8 }}>
          <div className="row spread wrap" style={{ gap: 6, alignItems: "baseline" }}>
            <span className="note" style={{ fontWeight: 600 }}>Scenario: {scored.scenario.name}</span>
            <span className="pill" style={{ background: "var(--amber-b)" }}>Major Fit: {scored.scenario.label}</span>
          </div>
          <div className="note" style={{ fontSize: 11, marginTop: 4 }}>
            Primary: {scored.scenario.breakdown.primary.field} {scored.scenario.breakdown.primary.statusWord}
            {" · "}Secondary: {scored.scenario.breakdown.secondary.field} {scored.scenario.breakdown.secondary.statusWord}
            {" · "}Supporting: {scored.scenario.breakdown.supporting.label}
          </div>
          {scored.scenario.quantumNote && (
            <div className="note" style={{ fontSize: 11, marginTop: 4, color: "var(--amber)" }}>{scored.scenario.quantumNote}</div>
          )}
        </div>
      )}

      {/* Program-availability provenance — never claim a major without evidence */}
      {mf && (
        <div className="row" style={{ gap: 6, marginBottom: 8 }}>
          {mf.status === "verified" ? (
            <>
              <SourceBadge level="official" />
              <span className="note" style={{ fontSize: 11, color: "var(--safety)" }}>
                {scored.scenario ? "Program pathway verified for selected Career Track" : "Offers your Profile major / interest area"}
              </span>
            </>
          ) : mf.status === "no-match" ? (
            <>
              <SourceBadge level="official" />
              <span className="note" style={{ fontSize: 11, color: "var(--reach)" }}>No matching bachelor's program in official data</span>
            </>
          ) : (
            <>
              <SourceBadge level="unavailable" />
              <span className="note" style={{ fontSize: 11, color: "var(--amber)" }}>Program availability not verified — confirm on official site</span>
            </>
          )}
        </div>
      )}

      {scored.explanation && (scored.explanation.reasons?.length > 0 || scored.explanation.concerns?.length > 0) && (
        <details style={{ marginBottom: 6 }}>
          <summary className="note" style={{ cursor: "pointer", fontWeight: 600 }}>Why it fits · possible concerns</summary>
          {scored.explanation.reasons?.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {scored.explanation.reasons.map((r, i) => <li key={i} className="note" style={{ color: "var(--safety)" }}>{r}</li>)}
            </ul>
          )}
          {scored.explanation.concerns?.length > 0 && (
            <>
              <div className="note" style={{ fontWeight: 600, marginTop: 6 }}>Possible concerns</div>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {scored.explanation.concerns.map((r, i) => <li key={i} className="note" style={{ color: "var(--reach)" }}>{r}</li>)}
              </ul>
            </>
          )}
        </details>
      )}

      {/* Collapsed by default so cards stay short */}
      <details>
        <summary className="note" style={{ cursor: "pointer", fontWeight: 600 }}>Show fit breakdown</summary>
        <div className="stack" style={{ gap: 6, marginTop: 8 }}>
          <ScoreRow label="Academic fit" value={subs.academic} />
          <ScoreRow label="Major / Program fit" value={subs.major} />
          <ScoreRow label="Affordability" value={subs.financial} />
          <ScoreRow label="Career / ROI" value={subs.career} />
          <ScoreRow label="Outcomes" value={subs.outcome} />
          <ScoreRow label="Extracurriculars" value={subs.ec} />
        </div>
      </details>

      <div className="row spread" style={{ marginTop: 10 }}>
        <div className="row" style={{ gap: 8 }}>
          <SourceBadge level="official">Scorecard</SourceBadge>
          <span className="note" style={{ fontSize: 11 }}>Overall {scored.overall ?? "—"}</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost sm" onClick={() => onOpen(c.id)}>Details</button>
          <button className={`btn sm ${saved ? "ghost" : "amber"}`} onClick={() => onToggleSave(scored)}>
            {saved ? "Saved ✓" : "+ My List"}
          </button>
        </div>
      </div>
    </div>
  );
}
