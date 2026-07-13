// About.jsx — explains how CollegeGene AI works, its data sources, and the
// disclaimer (moved here from every page).
import React from "react";

export function About() {
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <div className="eyebrow">About</div>
        <h1>How CollegeGene AI works</h1>
        <p className="lead">A personalized college, major, and career planning tool that runs on official data —
          built to help one student and family navigate the whole application process.</p>
      </div>

      <div className="card pad stack">
        <h3>1. Build your profile</h3>
        <p className="note">Enter your academics (GPA, SAT/ACT, rigor, rank), interests, budget, and goals — or upload
          your transcript, resume, and portfolio (including a portfolio link) and let the app read them to help fill
          it in. The more complete your profile, the more accurate your matches.</p>
      </div>

      <div className="card pad stack">
        <h3>2. Get your college matches</h3>
        <p className="note">The app pulls real colleges from the U.S. Department of Education College Scorecard and
          scores each one for you across academic fit, cost, career outcomes, and extracurricular strength. It sorts
          them into <strong>Reach</strong>, <strong>Target</strong>, and <strong>Safety</strong> using published
          admission rates and your profile — always as ranges, never false precision. Save the ones you like to
          <strong> My list</strong>.</p>
      </div>

      <div className="card pad stack">
        <h3>3. Understand each college</h3>
        <p className="note">Open any college for a full dossier: official data (admit rate, cost, net price, earnings,
          graduation) with source labels, verified admissions details (rounds, testing policy, essays, deadlines),
          and — for our 28 seeded colleges — what they look for, how they select, their culture, your culture-fit
          score, which major to apply to, and a what-if simulator.</p>
      </div>

      <div className="card pad stack">
        <h3>4. Explore majors, careers &amp; courses</h3>
        <p className="note">See where a major leads using U.S. Bureau of Labor Statistics career data (median pay,
          projected growth). Search any college in the <strong>Courses</strong> tab to see its programs and notable
          major combinations and dual-degrees.</p>
      </div>

      <div className="card pad stack">
        <h3>5. Compare &amp; track</h3>
        <p className="note">Put your saved colleges side by side in <strong>Compare</strong> with weighted scoring for
          what matters to you, and manage the whole process in <strong>Tracker</strong> — deadlines, forms, essays,
          decisions, and student + parent notes, with CSV export. Back up your data anytime.</p>
      </div>

      <div className="card pad stack">
        <h3>Where the data comes from</h3>
        <p className="note">College facts come from the <strong>U.S. Department of Education College Scorecard</strong>.
          Career figures come from the <strong>U.S. Bureau of Labor Statistics</strong>. Admissions and selection
          details come from each college's official site or Common Data Set, each labeled with its source and review
          date. Fit scores and Reach/Target/Safety categories are <strong>estimates</strong> generated from that data.
          Where a fact isn't published, the app says "Data unavailable" rather than inventing it.</p>
      </div>

      <div className="disclaimer">
        <strong>Disclaimer.</strong> CollegeGene AI is a planning aid built by a student — not a counseling service or
        an admissions office. Admissions are holistic, competitive, and unpredictable, and these estimates are not
        guarantees. College costs, aid, deadlines, scholarship availability, and career outcomes vary by family and
        change over time. Always confirm information with each college's official website, net price calculator,
        admissions and financial-aid offices, FAFSA/CSS Profile, and a qualified school counselor before making
        decisions.
      </div>
    </div>
  );
}
