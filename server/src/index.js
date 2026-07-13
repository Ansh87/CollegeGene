// index.js — Express server. Serves /api/* (key-protected) and the static
// client build. The browser never sees any API key.
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, keyStatus } from "./config.js";
import "./db/database.js"; // ensure schema is created on boot
import { collegesRouter } from "./routes/colleges.js";
import { careersRouter, studentRouter, advisorRouter } from "./routes/misc.js";
import { debugRouter } from "./routes/debug.js";
import { documentsRouter } from "./routes/documents.js";
import { requireAuth } from "./middleware/firebaseAuth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" })); // headroom: scored college lists can be large

// Health + key status (never reveals the key itself).
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    dataSources: {
      colleges: "U.S. Department of Education College Scorecard",
      careers: "U.S. Bureau of Labor Statistics (OOH)",
      verified: "Manually verified from official college admissions sites / Common Data Set",
    },
    keys: keyStatus(),
    cacheTtlHours: config.cacheTtlMs / 3600000,
  });
});

// Public catalog + stateless matching (client sends the profile in the request
// body; nothing user-specific is read from the DB here).
app.use("/api/colleges", collegesRouter);
app.use("/api/careers", careersRouter);
// Protected: these read/write per-user profile, saved list, applications, and
// documents. requireAuth verifies the Firebase ID token and sets req.user.
app.use("/api/students", requireAuth, studentRouter);
app.use("/api/advisor", requireAuth, advisorRouter);
app.use("/api/documents", requireAuth, documentsRouter);
app.use("/api/debug", debugRouter);

// GET /api/backup -> download a copy of the SQLite database file so the family
// can keep a backup of profile/list/tracker data. (Suggested by the review.)
app.get("/api/backup", (_req, res) => {
  const p = path.resolve(config.dbPath);
  res.download(p, `collegegene-backup-${new Date().toISOString().slice(0,10)}.db`, (err) => {
    if (err && !res.headersSent) res.status(500).json({ error: "backup_failed", message: "Could not read the database file." });
  });
});

// Serve built client (client/dist) if present.
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(200).send("CollegeGene API is running. Build the client (cd client && npm run build) to serve the UI.");
  });
});

app.listen(config.port, () => {
  console.log(`CollegeGene server on http://localhost:${config.port}`);
  console.log("Data sources: College Scorecard (live), BLS OOH (snapshot/live), verified profiles (DB).");
  console.log("Key status:", keyStatus());
});
