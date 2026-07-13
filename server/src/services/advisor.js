// advisor.js — the AI college advisor. When a Gemini key is configured, it
// answers using the student's real profile + their scored college list as
// grounding, following the spec's guardrails (no guarantees, cite data,
// separate fact from estimate, recommend counselor review). Without a key, it
// falls back to the deterministic keyword answers so the feature always works.
import { config } from "../config.js";

const SYSTEM_GUARDRAILS = `You are CollegeGene's college advisor for a single high-school student and their family.
Rules you MUST follow:
- Never guarantee admission or say the student "will" or "won't" get in. Admissions are holistic and unpredictable.
- Use ONLY the data provided in context (the student's profile and their scored college list). Do NOT invent college facts, admission rates, deadlines, or scholarships.
- Separate facts (from official data) from estimates (fit scores, categories). Say when something is an estimate.
- Be concrete and personal: reference the student's actual numbers and their actual list when relevant.
- Encourage an authentic student voice; never write dishonest essays or suggest fake activities.
- Recommend confirming with the school counselor and each college's official site for anything high-stakes.
- Keep answers focused and practical (a few short paragraphs max). No stereotypes; no advice based on protected characteristics.`;

export async function answerAdvisor({ question, profile, recommendations }) {
  if (config.gemini.apiKey) {
    const viaAI = await answerWithGemini({ question, profile, recommendations });
    if (viaAI) return viaAI;
  }
  return { answer: keywordAnswer({ question, profile, recommendations }), source: "rules", disclaimer: DISCLAIMER };
}

const DISCLAIMER = "Planning aid only. Not a substitute for your school counselor or a college's admissions office.";

async function answerWithGemini({ question, profile, recommendations }) {
  // Build a compact, grounded context from the scored list (top 25 to keep it small).
  const list = (recommendations || []).slice(0, 25).map((r) => ({
    name: r.college?.name,
    state: r.college?.state,
    category: r.admission?.category,
    admitRate: r.college?.admissionRate,
    satMid: r.college?.satMidpoint,
    netCost: r.netCost,
    overall: r.overall,
    roiPayback: r.roi?.paybackYears,
    round: r.round?.round,
  }));
  const prof = {
    grade: profile.grade, state: profile.state, gpa: profile.gpa, gpaWeighted: profile.gpaWeighted,
    sat: profile.satSuper || profile.sat, act: profile.actSuper || profile.act, apCount: profile.apCount,
    interests: profile.interests, careerGoals: profile.careerGoals, budget: profile.budget,
    hasResearch: profile.hasResearch, hasLeadership: profile.hasLeadership, willingED: profile.willingED,
    gradSchoolInterest: profile.gradSchoolInterest,
  };
  const prompt = `${SYSTEM_GUARDRAILS}

STUDENT PROFILE (JSON):
${JSON.stringify(prof)}

STUDENT'S SCORED COLLEGE LIST (JSON, estimates from official data):
${JSON.stringify(list)}

STUDENT QUESTION: "${question}"

Answer in this shape (plain text, no markdown headers):
1) A direct, personal answer grounded in the data above.
2) One line naming what data you used.
3) If relevant, one short "next step" suggestion.
Remember: estimates not guarantees; recommend counselor review for big decisions.`;

  const model = config.gemini.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.gemini.apiKey}`;
  try {
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
    });
    if (!res.ok) return null; // fall back to keyword
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;
    return { answer: text, source: `Google Gemini (${model})`, disclaimer: DISCLAIMER };
  } catch {
    return null;
  }
}

// Deterministic fallback (also used when no key). Mirrors the prior behavior.
function keywordAnswer({ question, profile, recommendations }) {
  const q = (question || "").toLowerCase();
  const withCat = (cat) => (recommendations || []).filter((r) => r.admission?.category === cat);
  if (/safety|likely|match/.test(q)) {
    const s = withCat("Safety").slice(0, 5).map((r) => r.college.name);
    return s.length ? `Based on official admission rates and your academics, these lean Safety/likely: ${s.join(", ")}. Admissions are still holistic and not guaranteed.`
      : "No clear Safety schools in the current list. Add some larger public universities in your state and re-run recommendations.";
  }
  if (/reach|hard|selective/.test(q)) {
    const r = withCat("Reach").slice(0, 5).map((x) => x.college.name);
    return r.length ? `These are Reach schools given published admission rates: ${r.join(", ")}. Keep 2–4 reaches balanced with targets and safeties.`
      : "No Reach schools currently flagged. If you want to aim higher, add more selective institutions.";
  }
  if (/cost|afford|money|net price|budget/.test(q)) {
    const priced = (recommendations || []).filter((r) => r.netCost != null).slice(0, 5);
    return priced.length ? `Estimated net costs (official College Scorecard figures where available): ${priced.map((r) => `${r.college.name} ≈ $${r.netCost.toLocaleString()}`).join("; ")}. Confirm with each college's official net price calculator.`
      : "Net price data isn't available for the current list. Check each college's official net price calculator.";
  }
  if (/major|career|salary|job/.test(q)) {
    const major = (profile.interests && profile.interests[0]) || "your intended major";
    return `Career outcomes for ${major} come from BLS data in the Careers and Majors tabs, with median pay and projected growth. Salaries are national medians and estimates, not guarantees.`;
  }
  if (/\bed\b|early decision|\bea\b|early action|round|when.*apply/.test(q)) {
    return "Application-round strategy depends on each school's category: reaches often benefit most from ED if you're willing to commit and the finances work; targets suit EA; safeties suit early/rolling. Open any college for its specific recommended round.";
  }
  if (/improve|chances|better|retake/.test(q)) {
    return "To strengthen your applications: keep test scores near or above each school's published SAT midpoint, deepen one or two extracurriculars into leadership or research, and balance reach/target/safety. Open a college to see what to improve for that specific school. These are general strategies, not guarantees.";
  }
  return "I can explain your Reach/Target/Safety split, estimated net costs (from College Scorecard), BLS career outcomes for your major, and application-round strategy. Ask about any of those. I only use data actually available for your list. For a fuller conversation, add a free Gemini key on the server.";
}
