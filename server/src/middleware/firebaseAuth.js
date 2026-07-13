// firebaseAuth.js — verifies Firebase ID tokens with the Admin SDK and attaches
// the authenticated user to the request. Identity only; no Firestore, no change
// to the app's own database model. Service-account credentials live ONLY here on
// the server and are never sent to the client.
import admin from "firebase-admin";
import { config } from "../config.js";

let initialized = false;
let initError = null;

// Lazily initialize the Admin SDK from whatever credentials are configured.
// Prefer FIREBASE_SERVICE_ACCOUNT_JSON (one blob, easiest on Railway); otherwise
// use the three discrete fields. If neither is present, we don't initialize —
// protected routes then 401 (unless dev bypass is on).
function ensureInit() {
  if (initialized || initError) return;
  try {
    let credentialObj = null;

    if (config.firebase.serviceAccountJson) {
      credentialObj = JSON.parse(config.firebase.serviceAccountJson);
    } else if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      credentialObj = {
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        // Railway/dotenv often escape newlines in the private key; restore them.
        privateKey: config.firebase.privateKey.replace(/\\n/g, "\n"),
      };
    }

    if (!credentialObj) {
      initError = new Error("Firebase Admin credentials not configured.");
      return;
    }
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(credentialObj) });
    }
    initialized = true;
  } catch (e) {
    // Never log the private key or token; log only a short reason.
    initError = new Error(`Firebase Admin init failed: ${e.message.slice(0, 120)}`);
  }
}

// A fixed dev user used only when AUTH_DEV_BYPASS=true and NODE_ENV!=="production".
const DEV_USER = { uid: "dev-local-user", email: "dev@localhost", name: "Local Dev" };

// Express middleware: require a valid Firebase ID token.
export async function requireAuth(req, res, next) {
  // Local dev bypass (never in production; off unless explicitly enabled).
  if (config.authDevBypass) {
    req.user = DEV_USER;
    return next();
  }

  ensureInit();
  if (!initialized) {
    return res.status(503).json({
      error: "auth_unconfigured",
      message: "Authentication is not configured on the server. Set FIREBASE_SERVICE_ACCOUNT_JSON (or the FIREBASE_* fields).",
    });
  }

  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: "unauthorized", message: "Missing or malformed Authorization header." });
  }
  const idToken = match[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || decoded.email || null,
    };
    return next();
  } catch (e) {
    // Do not log the token. Log only that verification failed.
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired authentication token." });
  }
}

// Resolve the effective per-user data key. Authenticated requests are ALWAYS
// keyed by the Firebase UID (user isolation). Any studentId in the URL/body is
// ignored for authed requests so a user can never read another user's data by
// guessing an id.
export function effectiveStudentId(req, fallback) {
  if (req.user && req.user.uid) return req.user.uid;
  return fallback || null;
}
