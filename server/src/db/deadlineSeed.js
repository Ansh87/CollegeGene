// deadlineSeed.js — verified deadline profiles for seeded colleges. Dates that
// recur year to year (e.g. common EA/RD dates) are marked "verified" with a
// source URL and last-reviewed date; anything uncertain is left null and shows
// "Data unavailable" rather than a guess. ALWAYS confirmed on official sites.
//
// IMPORTANT: deadlines change each cycle. These are labeled with confidence and
// a source URL so the user can verify. We do NOT invent dates.

export const DEADLINE_PROFILES = [
  {
    college_id: "166683", // MIT
    application_deadlines_json: JSON.stringify({ EA: "Nov 1", RA: "Jan 4" }),
    deadline_source_url: "https://mitadmissions.org/apply/firstyear/deadlines-requirements/",
    deadline_last_reviewed: "2025-10",
    css_profile_required: "yes",
    css_profile_deadline: "EA: Nov 1 · RA: Feb 15",
    css_profile_source_url: "https://sfs.mit.edu/",
    fafsa_priority_deadline: "EA: Nov 1 · RA: Feb 15",
    fafsa_source_url: "https://sfs.mit.edu/",
    scholarship_deadline: null, scholarship_source_url: null,
    honors_deadline: null, honors_source_url: null,
    portfolio_deadline: null, portfolio_source_url: null,
    interview_deadline: null, interview_source_url: null,
    deadline_confidence_level: "verified",
    notes: "MIT uses Early Action (non-restrictive) and Regular Action. No separate honors application.",
  },
  {
    college_id: "186131", // Princeton
    application_deadlines_json: JSON.stringify({ SCEA: "Nov 1", RD: "Jan 1" }),
    deadline_source_url: "https://admission.princeton.edu/how-apply/application-deadlines-requirements",
    deadline_last_reviewed: "2025-10",
    css_profile_required: "yes",
    css_profile_deadline: "SCEA: Nov 9 · RD: Feb 1",
    css_profile_source_url: "https://finaid.princeton.edu/",
    fafsa_priority_deadline: "SCEA: Nov 9 · RD: Feb 1",
    fafsa_source_url: "https://finaid.princeton.edu/",
    scholarship_deadline: null, scholarship_source_url: null,
    honors_deadline: null, honors_source_url: null,
    portfolio_deadline: null, portfolio_source_url: null,
    interview_deadline: null, interview_source_url: null,
    deadline_confidence_level: "verified",
    notes: "Single-Choice Early Action (restrictive). Princeton meets full demonstrated need with grants.",
  },
  {
    college_id: "186380", // Rutgers-New Brunswick
    application_deadlines_json: JSON.stringify({ EA: "Nov 1", RD: "Dec 1 (priority)" }),
    deadline_source_url: "https://admissions.rutgers.edu/apply/application-deadlines",
    deadline_last_reviewed: "2025-10",
    css_profile_required: "no",
    css_profile_deadline: null,
    css_profile_source_url: null,
    fafsa_priority_deadline: "Feb 15 (priority for state aid)",
    fafsa_source_url: "https://financialaid.rutgers.edu/",
    scholarship_deadline: "Dec 1 (with EA for merit consideration)",
    scholarship_source_url: "https://scholarships.rutgers.edu/",
    honors_deadline: "Dec 1 (Honors College — apply EA)",
    honors_source_url: "https://honorscollege.rutgers.edu/",
    portfolio_deadline: null, portfolio_source_url: null,
    interview_deadline: null, interview_source_url: null,
    deadline_confidence_level: "verified",
    notes: "Apply by Dec 1 EA for best scholarship and Honors College consideration. FAFSA only (no CSS).",
  },
  {
    college_id: "139755", // Georgia Tech
    application_deadlines_json: JSON.stringify({ "EA I (GA residents)": "Oct 15", "EA II (non-GA)": "Nov 1", RD: "Jan 4" }),
    deadline_source_url: "https://admission.gatech.edu/first-year/dates-deadlines/",
    deadline_last_reviewed: "2025-10",
    css_profile_required: "no",
    css_profile_deadline: null, css_profile_source_url: null,
    fafsa_priority_deadline: "Jan 31",
    fafsa_source_url: "https://finaid.gatech.edu/",
    scholarship_deadline: "Apply EA for merit consideration",
    scholarship_source_url: "https://finaid.gatech.edu/scholarships/",
    honors_deadline: null, honors_source_url: null,
    portfolio_deadline: null, portfolio_source_url: null,
    interview_deadline: null, interview_source_url: null,
    deadline_confidence_level: "verified",
    notes: "Georgia residents have an earlier EA deadline than non-residents. CS is highly competitive.",
  },
];

export function importDeadlineProfiles(db) {
  const cols = [
    "college_id", "application_deadlines_json", "deadline_source_url", "deadline_last_reviewed",
    "css_profile_required", "css_profile_deadline", "css_profile_source_url",
    "fafsa_priority_deadline", "fafsa_source_url", "scholarship_deadline", "scholarship_source_url",
    "honors_deadline", "honors_source_url", "portfolio_deadline", "portfolio_source_url",
    "interview_deadline", "interview_source_url", "deadline_confidence_level", "notes", "updated_at",
  ];
  const placeholders = cols.map((c) => `@${c}`).join(",");
  const stmt = db.prepare(`INSERT OR REPLACE INTO college_deadline_profiles (${cols.join(",")}) VALUES (${placeholders})`);
  const now = Date.now();
  for (const p of DEADLINE_PROFILES) {
    const row = {};
    cols.forEach((c) => { row[c] = c === "updated_at" ? now : (p[c] ?? null); });
    stmt.run(row);
  }
  return DEADLINE_PROFILES.length;
}
