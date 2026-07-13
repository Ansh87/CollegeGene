// database.js — SQLite via Node's built-in node:sqlite (Node 22+). No native
// compilation needed. Implements all spec tables + an api_cache table.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

// Ensure the database's parent directory exists. This matters when DB_PATH points
// at a mounted persistent volume (e.g. /data/collegegene.db on Railway) whose
// directory must exist before the file can be opened.
const dbDir = path.dirname(path.resolve(config.dbPath));
fs.mkdirSync(dbDir, { recursive: true });

export const db = new DatabaseSync(config.dbPath);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
CREATE TABLE IF NOT EXISTS api_cache (
  cache_key TEXT PRIMARY KEY, payload TEXT NOT NULL, fetched_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS students (
  student_id TEXT PRIMARY KEY, name TEXT, grade INTEGER, graduation_year INTEGER,
  state_residence TEXT, budget INTEGER, academic_profile_json TEXT,
  extracurricular_profile_json TEXT, interests_json TEXT, career_goals_json TEXT,
  created_at INTEGER, updated_at INTEGER
);
CREATE TABLE IF NOT EXISTS colleges (
  college_id TEXT PRIMARY KEY, unit_id TEXT, name TEXT, city TEXT, state TEXT,
  region TEXT, control_type TEXT, institution_type TEXT, source TEXT,
  source_year INTEGER, last_updated INTEGER
);
CREATE TABLE IF NOT EXISTS college_scorecard_data (
  college_id TEXT PRIMARY KEY, admission_rate REAL, sat_midpoint INTEGER,
  act_midpoint INTEGER, tuition_in_state INTEGER, tuition_out_of_state INTEGER,
  average_net_price INTEGER, graduation_rate REAL, retention_rate REAL,
  median_earnings INTEGER, debt_median INTEGER, size INTEGER,
  source_year INTEGER, last_updated INTEGER
);
CREATE TABLE IF NOT EXISTS college_verified_profiles (
  college_id TEXT PRIMARY KEY, application_deadlines_json TEXT, testing_policy TEXT,
  recommendation_requirements TEXT, essay_requirements TEXT, scholarship_deadlines_json TEXT,
  css_profile_required TEXT, ed_available INTEGER, ea_available INTEGER, rea_available INTEGER,
  rd_available INTEGER, ed_acceptance_rate REAL, ea_acceptance_rate REAL, rd_acceptance_rate REAL,
  major_restrictions_json TEXT, honors_program_info TEXT, source_url TEXT, source_year INTEGER,
  last_reviewed TEXT, confidence_level TEXT
);
CREATE TABLE IF NOT EXISTS student_college_list (
  student_id TEXT, college_id TEXT, college_name TEXT, city TEXT, state TEXT,
  category TEXT, admission_probability_range TEXT,
  overall_fit_score REAL, academic_fit_score REAL, major_fit_score REAL, career_fit_score REAL,
  financial_fit_score REAL, application_round TEXT, status TEXT, notes TEXT,
  created_at INTEGER, updated_at INTEGER, PRIMARY KEY (student_id, college_id)
);
CREATE TABLE IF NOT EXISTS application_tracker (
  student_id TEXT, college_id TEXT, college_name TEXT, application_round TEXT, application_deadline TEXT,
  scholarship_deadline TEXT, fafsa_deadline TEXT, css_deadline TEXT, transcript_status TEXT,
  recommendation_status TEXT, essay_status TEXT, supplement_status TEXT, interview_status TEXT,
  portfolio_status TEXT, submitted_status TEXT, decision_status TEXT, financial_aid_received TEXT,
  final_net_cost INTEGER, status TEXT, student_notes TEXT, parent_notes TEXT, updated_at INTEGER,
  PRIMARY KEY (student_id, college_id)
);
CREATE TABLE IF NOT EXISTS college_deadline_profiles (
  college_id TEXT PRIMARY KEY,
  application_deadlines_json TEXT,
  deadline_source_url TEXT,
  deadline_last_reviewed TEXT,
  css_profile_required TEXT,
  css_profile_deadline TEXT,
  css_profile_source_url TEXT,
  fafsa_priority_deadline TEXT,
  fafsa_source_url TEXT,
  scholarship_deadline TEXT,
  scholarship_source_url TEXT,
  honors_deadline TEXT,
  honors_source_url TEXT,
  portfolio_deadline TEXT,
  portfolio_source_url TEXT,
  interview_deadline TEXT,
  interview_source_url TEXT,
  deadline_confidence_level TEXT,
  notes TEXT,
  updated_at INTEGER
);
CREATE TABLE IF NOT EXISTS scholarships (
  scholarship_id TEXT PRIMARY KEY, student_id TEXT, name TEXT, provider TEXT, amount TEXT,
  renewable TEXT, eligibility TEXT, deadline TEXT, essays TEXT, recommendations TEXT,
  gpa_requirement TEXT, major_requirement TEXT, residency TEXT, citizenship TEXT,
  link TEXT, status TEXT, notes TEXT, created_at INTEGER, updated_at INTEGER
);
CREATE TABLE IF NOT EXISTS documents (
  doc_id TEXT PRIMARY KEY, student_id TEXT, kind TEXT, filename TEXT, mimetype TEXT,
  size INTEGER, text_excerpt TEXT, stored_path TEXT, parsed_json TEXT,
  uploaded_at INTEGER
);
CREATE TABLE IF NOT EXISTS careers (
  career_id TEXT PRIMARY KEY, occupation_name TEXT, bls_code TEXT, median_pay INTEGER,
  projected_growth TEXT, typical_entry_education TEXT, related_majors_json TEXT,
  source TEXT, source_year INTEGER, last_updated INTEGER
);
CREATE TABLE IF NOT EXISTS major_career_mapping (
  major_name TEXT PRIMARY KEY, related_careers_json TEXT, salary_range TEXT, job_outlook TEXT,
  ai_impact TEXT, graduate_school_need TEXT, source TEXT, last_updated INTEGER
);
CREATE TABLE IF NOT EXISTS college_selection_profiles (
  college_id TEXT PRIMARY KEY,
  admit_factors_json TEXT,      -- CDS admission factors + rating
  culture_json TEXT,            -- vibe, values, environment tags
  what_they_want TEXT,          -- prose: what this college looks for
  how_they_select TEXT,         -- prose: selection philosophy
  applies_by_major INTEGER,     -- 1 = admitted by major/college, 0 = whole-institute
  major_competition_json TEXT,  -- per-major competitiveness + direct-admit info
  switch_major_json TEXT,       -- can you change major later? restrictions
  ideal_applicant_json TEXT,    -- profile signals this school rewards
  source_url TEXT, source_year INTEGER, last_reviewed TEXT, confidence_level TEXT
);
`);

const getCacheStmt = db.prepare("SELECT payload, fetched_at FROM api_cache WHERE cache_key = ?");
const setCacheStmt = db.prepare(
  "INSERT INTO api_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?) " +
  "ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at"
);

export function cacheGet(key) {
  const row = getCacheStmt.get(key);
  if (!row) return null;
  return { data: JSON.parse(row.payload), fetchedAt: row.fetched_at };
}
export function cacheSet(key, data) {
  setCacheStmt.run(key, JSON.stringify(data), Date.now());
}


// --- Safe migrations: add a column only when it doesn't already exist. ---
function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
// Full extracted text for AI parsing. text_excerpt stays a short UI preview.
addColumnIfMissing("documents", "extracted_text", "TEXT");
addColumnIfMissing("documents", "extract_reason", "TEXT");

export default db;
