// Courses.jsx — type a college name, see its undergraduate & engineering
// programs (live from College Scorecard) plus verified major combinations /
// dual-degrees for seeded colleges.
import React, { useState } from "react";
import { api } from "../lib/api.js";
import { SourceBadge, Spinner, ErrorNote } from "./ui.jsx";

export function Courses({ onOpen }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true); setErr(null); setResults([]); setPrograms(null); setSelected(null);
    try {
      const r = await api.searchColleges({ name: q.trim() });
      setResults(r.results || []);
      if (!r.results?.length) setErr({ message: "No colleges found with that name. Try a shorter or different spelling." });
    } catch (e) { setErr(e); }
    finally { setSearching(false); }
  };

  const pick = async (c) => {
    setSelected(c); setPrograms(null); setLoading(true); setErr(null);
    try { setPrograms(await api.programs(c.id)); }
    catch (e) { setErr(e); }
    finally { setLoading(false); }
  };

  // group programs by broad area for readability
  const grouped = programs?.programs ? groupPrograms(programs.programs) : null;

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Courses &amp; programs</div>
        <h1>What can you study there?</h1>
        <p className="lead">Search a college to see its undergraduate and engineering programs from official
          data, plus notable major combinations and dual-degrees for our verified colleges.</p>
      </div>

      <div className="card pad">
        <label className="lbl">College name</label>
        <div className="row" style={{ gap: 8 }}>
          <input className="inp" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()} placeholder="e.g. Georgia Tech, MIT, Rutgers" />
          <button className="btn primary" onClick={search} disabled={searching}>Search</button>
        </div>
      </div>

      {searching && <div className="card pad"><Spinner label="Searching colleges…" /></div>}
      {err && <ErrorNote onRetry={selected ? () => pick(selected) : search}>{err.message}</ErrorNote>}

      {results.length > 0 && !selected && (
        <div className="stack">
          <h3>Select a college</h3>
          {results.map((c) => (
            <div key={c.id} className="card pad row spread" style={{ cursor: "pointer" }} onClick={() => pick(c)}>
              <div>
                <strong>{c.name}</strong>
                <div className="note">{[c.city, c.state].filter(Boolean).join(", ")} · {c.controlType || ""}</div>
              </div>
              <button className="btn ghost sm">View programs →</button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="stack">
          <div className="row spread wrap">
            <div>
              <h2>{selected.name}</h2>
              <div className="note">{[selected.city, selected.state].filter(Boolean).join(", ")}</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn ghost sm" onClick={() => { setSelected(null); setPrograms(null); }}>← Back</button>
              <button className="btn amber sm" onClick={() => onOpen(selected.id)}>Full dossier</button>
            </div>
          </div>

          {loading && <div className="card pad"><Spinner label="Loading programs…" /></div>}

          {programs && !programs.available && (
            <div className="card pad"><p className="note">{programs.note}</p></div>
          )}

          {programs?.available && (
            <>
              {/* verified combinations / dual-degrees */}
              {programs.notes && (
                <div className="card pad stack">
                  <div className="row spread"><h3>Notable major combinations &amp; dual-degrees</h3><SourceBadge level="verified" /></div>
                  {programs.notes.combinations && (
                    <div>
                      <div className="note" style={{ fontWeight: 600, marginBottom: 6 }}>Popular combinations</div>
                      <div className="chips">{programs.notes.combinations.map((x) => <span key={x} className="pill">{x}</span>)}</div>
                    </div>
                  )}
                  {programs.notes.dualDegrees && (
                    <div>
                      <div className="note" style={{ fontWeight: 600, margin: "6px 0" }}>Dual-degree / special programs</div>
                      <div className="chips">{programs.notes.dualDegrees.map((x) => <span key={x} className="pill">{x}</span>)}</div>
                    </div>
                  )}
                  {programs.notes.engineering && (
                    <div>
                      <div className="note" style={{ fontWeight: 600, margin: "6px 0" }}>Engineering</div>
                      <p className="note">{programs.notes.engineering}</p>
                    </div>
                  )}
                  {programs.notes.note && <p className="note">{programs.notes.note}</p>}
                  {programs.notes.url && <a className="link" href={programs.notes.url} target="_blank" rel="noreferrer">Official program page ↗</a>}
                </div>
              )}

              {/* live program list */}
              {grouped && Object.keys(grouped).length > 0 ? (
                <div className="card pad">
                  <div className="row spread" style={{ marginBottom: 8 }}>
                    <h3>All undergraduate programs</h3><SourceBadge level="official">Scorecard</SourceBadge>
                  </div>
                  <div className="note" style={{ marginBottom: 10 }}>{programs.programs.length} bachelor's programs · Source: {programs.source}, {programs.sourceYear}</div>
                  {Object.entries(grouped).map(([area, list]) => (
                    <details key={area} style={{ marginBottom: 8 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{area} <span className="note">({list.length})</span></summary>
                      <div className="chips" style={{ marginTop: 8 }}>
                        {list.map((p) => <span key={p.title} className="pill">{p.title}</span>)}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="card pad"><p className="note">Official per-program list isn't available for this college in College Scorecard. Confirm majors on the college's official site.</p></div>
              )}

              <div className="disclaimer">{programs.disclaimer}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Group CIP program titles into broad areas for readability.
function groupPrograms(programs) {
  const areas = {
    "Computing & Data": /comput|informat|data|software|cyber|network/i,
    "Engineering": /engineer|mechatron/i,
    "Math & Physical Science": /math|statist|physic|chemist|astronom|geolog/i,
    "Life & Health Science": /biolog|biochem|neuro|health|nursing|kinesi|nutrition|medic/i,
    "Business & Economics": /business|econ|financ|account|marketing|management|entrepreneur/i,
    "Social Science": /psycholog|sociolog|political|anthropolog|geograph|criminolog|policy|international/i,
    "Humanities & Arts": /english|histor|philosoph|languag|literat|art|music|theat|design|media|communic|writing/i,
    "Education": /educat|teach/i,
  };
  const out = {}; const other = [];
  for (const p of programs) {
    let placed = false;
    for (const [area, re] of Object.entries(areas)) {
      if (re.test(p.title)) { (out[area] = out[area] || []).push(p); placed = true; break; }
    }
    if (!placed) other.push(p);
  }
  if (other.length) out["Other"] = other;
  return out;
}
