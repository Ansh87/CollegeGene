// Majors.jsx — majors that fit the student, with why, careers, grad-school
// signal, and outlook.
import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api.js";
import { Spinner, SourceBadge, fmtUSD } from "./ui.jsx";
import { US_STATES } from "../lib/states.js";

export function Majors({ profile, onOpen, onToggleSave, savedIds }) {
  const [majors, setMajors] = useState([]);
  const [doubles, setDoubles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [majorQuery, setMajorQuery] = useState("");
  const [major2Query, setMajor2Query] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [majorColleges, setMajorColleges] = useState(null);
  const [comboMode, setComboMode] = useState(false);
  const [searchingMajor, setSearchingMajor] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  const [majorSearchError, setMajorSearchError] = useState(null);
  const [tab, setTab] = useState("search");   // "search" | "recommendations"
  const searchRef = useRef(null);

  const resetSearch = () => {
    setMajorQuery(""); setMajor2Query(""); setStateFilter("");
    setComboMode(false); setMajorColleges(null); setSearchMeta(null); setMajorSearchError(null);
  };

  // Pick a combo -> jump to the search box so the user sees what was selected.
  const useCombo = (primary, partner) => {
    setComboMode(true); setMajorQuery(primary); setMajor2Query(partner);
    setMajorColleges(null); setSearchMeta(null); setMajorSearchError(null);
    setTab("search");
    setTimeout(() => searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  const runSearch = async () => {
    const q = majorQuery.trim();
    if (!q) return;
    setSearchingMajor(true); setMajorColleges(null); setSearchMeta(null); setMajorSearchError(null);
    try {
      const r = (comboMode && major2Query.trim())
        ? await api.collegeMajorCombos(q, major2Query.trim(), stateFilter || undefined)
        : await api.collegesByMajor(q, stateFilter || undefined);
      setMajorColleges(r.colleges || []);
      setSearchMeta({ ...r, combo: !!(comboMode && major2Query.trim()) });
    } catch (err) {
      // An API failure is NOT the same as "no colleges matched".
      setMajorSearchError(err?.message || "Could not check official program data.");
      setMajorColleges(null);
    } finally {
      setSearchingMajor(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    api.recommendMajors(profile).then((r) => { setMajors(r.majors || []); setDoubles(r.doubleMajors || []); }).catch(() => { setMajors([]); setDoubles([]); }).finally(() => setLoading(false));
  }, [profile]);

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Majors for you</div>
        <h1>Majors that fit your profile</h1>
        <p className="lead">Ranked from your interests, strengths, and career goals — each with where it leads and
          whether it typically needs graduate school. Based on official BLS career data.</p>
      </div>

      <div className="row wrap" style={{ gap: 6 }}>
        <button className={`btn sm ${tab === "search" ? "primary" : "ghost"}`} onClick={() => setTab("search")}>
          Find colleges by major
        </button>
        <button className={`btn sm ${tab === "recommendations" ? "primary" : "ghost"}`} onClick={() => setTab("recommendations")}>
          Major recommendations for you
        </button>
      </div>

      {tab === "search" && !loading && (
        doubles.length > 0 ? (
          <div className="card pad">
            <h3 style={{ marginBottom: 6 }}>Double-major &amp; combination ideas</h3>
            <p className="note" style={{ marginBottom: 12 }}>Strong pairings for your profile. The <strong>Courses</strong> tab shows which colleges actually offer these combinations (e.g. MIT 6-14, Penn M&amp;T, Georgia Tech CS Threads). Use the search below to check which colleges offer both fields.</p>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
              {doubles.map((d) => (
                <div key={d.combo} className="card pad" style={{ background: "var(--paper-2)" }}>
                  <div className="row spread">
                    <strong style={{ fontSize: 14 }}>{d.combo}</strong>
                    <span className="pill" style={{ background: d.strength === "Strong" ? "var(--safety-b)" : "var(--target-b)" }}>{d.strength}</span>
                  </div>
                  <p className="note" style={{ marginTop: 6 }}>{d.why}</p>
                  <button className="link" style={{ marginTop: 6 }}
                    onClick={() => useCombo(d.primary, d.partner)}>
                    Find colleges offering both →
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card pad">
            <h3 style={{ marginBottom: 6 }}>Double-major &amp; combination ideas</h3>
            <p className="note">Add at least one intended major to your Profile to see suggested double-major pairings.</p>
          </div>
        )
      )}

      {tab === "search" && (
      <div className="card pad" ref={searchRef}>
        <div className="row spread">
          <label className="lbl">Find colleges by major</label>
          <div className="row" style={{ gap: 6 }}>
            <span className={`chip ${!comboMode ? "on" : ""}`} onClick={() => setComboMode(false)}>Single major</span>
            <span className={`chip ${comboMode ? "on" : ""}`} onClick={() => setComboMode(true)}>Double major</span>
            <button className="btn ghost sm" onClick={resetSearch}>Reset</button>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
          <input className="inp" style={{ flex: 1, minWidth: 180 }} value={majorQuery} placeholder="Major 1 (e.g. Computer Science)"
            onChange={(e) => setMajorQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
          {comboMode && (
            <input className="inp" style={{ flex: 1, minWidth: 180 }} value={major2Query} placeholder="Major 2 (e.g. Finance)"
              onChange={(e) => setMajor2Query(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
          )}
          <input className="inp" style={{ width: 90 }} value={stateFilter} placeholder="State" maxLength={2}
            onChange={(e) => setStateFilter(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
          <button className="btn primary sm" onClick={runSearch}>Search</button>
        </div>
        <div className="row wrap" style={{ gap: 6, marginTop: 8, alignItems: "center" }}>
          <span className="note" style={{ fontWeight: 600 }}>State:</span>
          <select className="inp" style={{ width: "auto" }} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">Nationwide (all states)</option>
            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
        <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
          {majors.slice(0, 4).map((m) => (
            <span key={m.name} className="chip" onClick={() => { setMajorQuery(m.name); }}>{m.name}</span>
          ))}
        </div>

        {searchingMajor && <div style={{ marginTop: 10 }}><Spinner label="Checking official program data…" /></div>}

        {majorSearchError && !searchingMajor && (
          <div className="disclaimer" style={{ borderLeftColor: "var(--reach)", marginTop: 10 }}>
            <strong>Could not check official program data right now:</strong> {majorSearchError}
            <div className="note" style={{ marginTop: 4 }}>This is an API/connection problem — not a statement that no colleges match.</div>
            <button className="link" style={{ marginTop: 4 }} onClick={runSearch}>Try again</button>
          </div>
        )}

        {majorColleges && !searchingMajor && !majorSearchError && (
          <div style={{ marginTop: 12 }}>
            {searchMeta?.cipCodesUsed && (
              <div className="note" style={{ marginBottom: 6 }}>
                Source: {searchMeta.source || "College Scorecard"} · CIP codes used: {Array.isArray(searchMeta.cipCodesUsed) ? searchMeta.cipCodesUsed.join(", ") : [searchMeta.cipCodesUsed.major1, searchMeta.cipCodesUsed.major2].filter(Boolean).flat().join(", ")}
                {searchMeta.rawResultCount != null ? ` · ${searchMeta.rawResultCount} colleges checked` : ""}
              </div>
            )}
            {!majorColleges.length ? (
              <div className="empty">
                {stateFilter
                  ? `No verified matches in ${stateFilter}. Try nationwide.`
                  : "No colleges with a verified bachelor's program matched. Try a broader term."}
              </div>
            ) : (
              <>
                <div className="row spread" style={{ marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>
                    {searchMeta?.combo
                      ? `Colleges offering BOTH ${searchMeta.major1} and ${searchMeta.major2}`
                      : `Colleges offering ${searchMeta?.major || majorQuery}`}
                  </h3>
                  <span className="note">{majorColleges.length} found</span>
                </div>
                {searchMeta?.combo && (
                  <div className="disclaimer" style={{ borderLeftColor: "var(--amber)", marginBottom: 8 }}>
                    These colleges offer both fields at bachelor's level according to official College Scorecard
                    program data. That is <strong>not</strong> the same as permission to declare a formal double
                    major — confirm double-major and dual-degree rules with each college's catalog or advising office.
                  </div>
                )}
              </>
            )}
            {majorColleges.length > 0 && (
              <div className="stack" style={{ gap: 8 }}>
                {majorColleges.slice(0, 15).map((c) => (
                  <MajorCollegeCard key={c.id} c={c} profile={profile} searchMeta={searchMeta}
                    onOpen={onOpen} onToggleSave={onToggleSave} savedIds={savedIds} />
                ))}
              </div>
            )}
            {searchMeta?.disclaimer && <div className="note" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{searchMeta.disclaimer}</div>}
          </div>
        )}
      </div>

      )}

      {tab === "recommendations" && (
        loading ? <div className="card pad"><Spinner label="Matching majors to your profile…" /></div>
      : !majors.length ? <div className="empty">Add some interests and career goals to your profile to see major recommendations.</div>
      : (
        <div className="stack">
          {majors.map((m, i) => (
            <div key={m.name} className="card pad">
              <div className="row spread" style={{ alignItems: "flex-start" }}>
                <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <span className="mono" style={{ color: "var(--amber)", fontWeight: 600 }}>#{i + 1}</span>
                  <div>
                    <h3 style={{ marginBottom: 3 }}>{m.name}</h3>
                    <p className="note">{m.blurb}</p>
                  </div>
                </div>
                {m.gradSchool && <span className="pill" style={{ background: "var(--target-b)" }}>Often needs grad school</span>}
              </div>

              <p className="note" style={{ margin: "10px 0", color: "var(--ink-900)" }}>{m.why}</p>

              {m.careers?.length > 0 && (
                <div>
                  <div className="note" style={{ fontWeight: 600, marginBottom: 6 }}>Where it can lead</div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
                    {m.careers.map((c) => (
                      <div key={c.title || c.name} className="card pad" style={{ background: "var(--paper-2)", padding: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.title || c.name}</div>
                        <div className="note">
                          {c.medianPay ? `Median ${fmtUSD(c.medianPay)}` : ""}
                          {c.growth ? ` · ${c.growth > 0 ? "+" : ""}${c.growth}% growth` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <SourceBadge level="official">BLS</SourceBadge>
                <span className="note">Career figures are official BLS estimates; outcomes vary.</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// A college card in the Majors search results, with an on-demand
// "Evaluate against my profile" action (parity with Browse Colleges).
// Preserves all existing program/combo display; only adds the evaluate control.
function MajorCollegeCard({ c, profile, searchMeta, onOpen, onToggleSave, savedIds }) {
  const [scored, setScored] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalErr, setEvalErr] = useState(null);

  const evaluate = async () => {
    setEvaluating(true); setEvalErr(null);
    try {
      const r = await api.evaluateCollege(c.id, profile);
      setScored(r.scored);
    } catch (e) { setEvalErr(e.message || "Couldn't evaluate."); }
    finally { setEvaluating(false); }
  };

  return (
    <div className="card pad" style={{ background: "var(--paper-2)" }}>
      <div className="row spread">
        <strong>{c.name}</strong>
        <span className="note">{[c.city, c.state].filter(Boolean).join(", ")}</span>
      </div>
      {/* single-major matches */}
      {c.matchingPrograms && (
        <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
          {c.matchingPrograms.map((p) => (
            <span key={p.cipCode} className="pill" style={{ background: p.matchType === "exact" ? "var(--safety-b)" : "var(--target-b)" }}>
              {p.title} · CIP {p.cipCode} · {p.matchType}
            </span>
          ))}
        </div>
      )}
      {/* combo matches */}
      {c.offersMajor1 != null && (
        <div style={{ marginTop: 8 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="pill" style={{ background: "var(--safety-b)" }}>Offers both fields ✓</span>
            <span className="pill" style={{ background: "var(--amber-b)" }}>
              Double-major policy: {c.verifiedDoubleMajorPolicy === "verified" ? "verified" : "not verified"}
            </span>
          </div>
          <div className="grid cols-2" style={{ gap: 8, marginTop: 8 }}>
            <div>
              <div className="note" style={{ fontWeight: 600 }}>{searchMeta.major1}</div>
              {(c.matchingMajor1Programs || []).slice(0, 3).map((p) => (
                <div key={p.cipCode} className="note" style={{ fontSize: 11 }}>• {p.title} (CIP {p.cipCode})</div>
              ))}
            </div>
            <div>
              <div className="note" style={{ fontWeight: 600 }}>{searchMeta.major2}</div>
              {(c.matchingMajor2Programs || []).slice(0, 3).map((p) => (
                <div key={p.cipCode} className="note" style={{ fontSize: 11 }}>• {p.title} (CIP {p.cipCode})</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {c.relatedAvailablePrograms && c.relatedAvailablePrograms.length > 0 && (
        <div className="note" style={{ marginTop: 6 }}>Also available: {c.relatedAvailablePrograms.slice(0, 6).join(", ")}</div>
      )}
      {c.warning && <div className="note" style={{ marginTop: 6, color: "var(--muted)", fontSize: 11 }}>{c.warning}</div>}

      {scored && (
        <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
          <span className="pill" style={{ background: "var(--amber-b)" }}>
            Estimated fit based on your profile: {scored.overall ?? "—"}
          </span>
          {scored.coarseCategory && <span className="pill">{scored.coarseCategory}</span>}
        </div>
      )}
      {evalErr && <div className="note" style={{ marginTop: 6, color: "var(--reach)" }}>{evalErr}</div>}

      <div className="row" style={{ gap: 10, marginTop: 6 }}>
        <button className="link" onClick={() => onOpen && onOpen(c.id)}>View college →</button>
        {!scored && (
          <button className="link" onClick={evaluate} disabled={evaluating}>
            {evaluating ? "Evaluating…" : "Evaluate against my profile"}
          </button>
        )}
        {onToggleSave && (
          <button className="link" onClick={() => onToggleSave({ college: { id: c.id, name: c.name, state: c.state }, admission: null, overall: null })}>
            {savedIds?.has(c.id) ? "Saved ✓" : "+ List"}
          </button>
        )}
      </div>
    </div>
  );
}
