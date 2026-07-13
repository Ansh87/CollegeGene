// ui.jsx — shared primitives. The provenance badge is the signature element:
// every value shows where it came from and how confident we are.
import React from "react";

export const fmtPct = (v) => (v == null ? null : `${(v * 100).toFixed(1)}%`);
export const fmtUSD = (v) => (v == null ? null : `$${Number(v).toLocaleString()}`);
export const fmtNum = (v) => (v == null ? null : Number(v).toLocaleString());

// SourceBadge: Official | Verified | Estimated | Unavailable
export function SourceBadge({ level, children }) {
  const l = (level || "unavailable").toLowerCase();
  const label = children || l[0].toUpperCase() + l.slice(1);
  return <span className={`src ${l}`}>{label}</span>;
}

// DataField: label + value + provenance. If value is null/undefined, renders the
// spec-mandated "Data unavailable" treatment instead of inventing anything.
export function DataField({ label, value, level = "official", source, na = "Data unavailable" }) {
  const missing = value === null || value === undefined || value === "";
  return (
    <div className="field">
      <div className="field-row">
        <span className="k">{label}</span>
        <SourceBadge level={missing ? "unavailable" : level} />
      </div>
      {missing
        ? <span className="v na">{na}</span>
        : <span className="v">{value}</span>}
      {source && !missing && <span className="note" style={{ fontSize: 11 }}>Source: {source}</span>}
    </div>
  );
}

const GLYPH = { Reach: "▲", Target: "◆", Safety: "●", Unknown: "○" };
export function CategoryTag({ category, label, range }) {
  const c = category || "Unknown";
  return (
    <span className={`cat ${c}`} title={range ? `Estimated admission probability: ${range}` : ""}>
      <span className="glyph">{GLYPH[c]}</span>
      {c}{label ? ` · ${label}` : ""}
    </span>
  );
}

export function Meter({ value }) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  return <div className="meter"><span style={{ width: `${v}%` }} /></div>;
}

export function Spinner({ label }) {
  return <div className="row" style={{ gap: 10, color: "var(--muted)", fontSize: 13 }}>
    <span className="spinner" /> {label || "Loading official data…"}
  </div>;
}

export function ErrorNote({ children, onRetry }) {
  return (
    <div className="disclaimer" style={{ borderLeftColor: "var(--reach)", background: "#f7ece8" }}>
      <strong>Couldn’t load official data.</strong> {children}
      {onRetry && <> <button className="link" onClick={onRetry}>Try again</button></>}
    </div>
  );
}

// The full legal disclaimer required by the spec.
export function LegalDisclaimer() {
  return (
    <div className="disclaimer">
      <strong>How to read this tool.</strong> CollegeGene AI is a planning aid built by a student, not a
      counseling service or an admissions office. College facts come from the U.S. Department of Education
      College Scorecard; career figures from the U.S. Bureau of Labor Statistics; admissions details from each
      college’s official site or Common Data Set, each labeled with its source and review date. Fit scores and
      Reach/Target/Safety categories are <em>estimates</em> generated from that data. Admissions are holistic
      and unpredictable, and these estimates are not guarantees. Costs and aid vary by family — always confirm
      with each college’s official net price calculator and admissions office before making decisions.
    </div>
  );
}
