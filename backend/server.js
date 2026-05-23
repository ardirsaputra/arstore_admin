// server.js — ArStore API Server
// Serves both the mobile app API (/api/license, /api/payment-info, /api/feature-requests)
// and the admin API (/api/admin/*)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Postman, mobile app)
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Routes ────────────────────────────────────────────────────────────────────

// Mobile app routes (no admin auth)
app.use("/api/license", require("./routes/mobile-license"));
app.use("/api/feature-requests", require("./routes/feature-requests"));
app.use("/api/payment-info", require("./routes/payment-info"));

// Admin auth (no JWT guard on this router itself)
app.use("/api/admin/auth", require("./routes/admin-auth"));

// Admin protected routes (JWT guard applied inside each router)
app.use("/api/admin/stats", require("./routes/admin-stats"));
app.use("/api/admin/devices", require("./routes/admin-devices"));
app.use("/api/admin/codes", require("./routes/admin-codes"));
app.use("/api/admin/payment-info", require("./routes/payment-info")); // reuses same router (GET public, PUT admin-guarded)
app.use("/api/admin/feature-requests", require("./routes/feature-requests")); // reuses same router (GET/PATCH admin-guarded)

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: "Not found" }));

// ── Error handler ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ArStore API running on http://localhost:${PORT}`);
  console.log(`   Admin panel API: http://localhost:${PORT}/api/admin`);
  console.log(`   Mobile app API:  http://localhost:${PORT}/api`);
});
