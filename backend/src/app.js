const Sentry = require("@sentry/node");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0,
  });
}

const authRouter = require("./routes/auth");
const projectsRouter = require("./routes/projects");
const bomRouter = require("./routes/bom");
const bomItemsRouter = require("./routes/bomItems");
const routingRouter = require("./routes/routing");
const workCentresRouter = require("./routes/workCentres");
const materialRequestsRouter = require("./routes/materialRequests");
const itpRouter = require("./routes/itp");
const controlPlanRouter = require("./routes/controlPlan");
const ncrRouter = require("./routes/ncr");
const inspectionsRouter = require("./routes/inspections");
const wpsRouter = require("./routes/wps");
const wpqRouter = require("./routes/wpq");
const weldJointsRouter = require("./routes/weldJoints");
const clientsRouter = require("./routes/clients");
const opportunitiesRouter = require("./routes/opportunities");
const quotesRouter = require("./routes/quotes");
const financeRouter = require("./routes/finance");
const hrRouter = require("./routes/hr");
const uploadsRouter = require("./routes/uploads");
const parseRouter = require("./routes/parse");
const pdfRouter = require("./routes/pdf");
const { router: machinesRouter } = require("./routes/machines");
const meRouter = require("./routes/me");
const interventionsRouter = require("./routes/interventions");
const grnRouter = require("./routes/grn");
const dashboardAggregatesRouter = require("./routes/dashboardAggregates");
const labourHoursRouter = require("./routes/labourHours");
const scheduleRouter = require("./routes/schedule");
const deviationsRouter = require("./routes/deviations");
const mrpRouter = require("./routes/mrp");
const machineDowntimeRouter = require("./routes/machineDowntime");
const spcRouter = require("./routes/spc");
const calibrationRouter = require("./routes/calibration");
const jigsRouter = require("./routes/jigs");
const remnantsRouter = require("./routes/remnants");
const vendorQualityRouter = require("./routes/vendorQuality");
const leaveRequestsRouter = require("./routes/leaveRequests");
const attendanceRouter = require("./routes/attendance");
const expenseClaimsRouter = require("./routes/expenseClaims");
const projectCommentsRouter = require("./routes/projectComments");
const kaizenRouter = require("./routes/kaizen");
const fieldVisitsRouter = require("./routes/fieldVisits");
const customerComplaintsRouter = require("./routes/customerComplaints");
const cookieParser = require("cookie-parser");
const { authenticateJWT, requireDepartment } = require("./middleware/auth");
const { auditLog } = require("./middleware/auditLog");

const app = express();

// io injector — set after WebSocket server creation in index.js (NEW-08 mentions)
let _io = null;
app.setIo = (io) => { _io = io; };
app.use((req, _res, next) => { req.io = _io; next(); });

// ── Security headers ──────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5500",
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Rate limiting (global) ────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Health check (unauthenticated) ────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "nexaforge-api" });
});

// ── Auth routes (unauthenticated) ────────────────────────────
app.use("/auth", authRouter);

// ── Protected routes ─────────────────────────────────────────
// All routes mounted below this line require a valid JWT
app.use(authenticateJWT);
app.use(auditLog);

// ── S-10: Permissions + GM interventions (ARCH-01, ARCH-02) ──
app.use("/me", meRouter);
app.use("/api/interventions", interventionsRouter);
app.use("/api", interventionsRouter); // mounts /projects/:id/interventions

// ── S-02: Core API routes ─────────────────────────────────────
// Projects, BOM, routing and work-centres are cross-departmental (all depts need project visibility)
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:id/bom",     requireDepartment("production", "procurement", "store"), bomRouter);
app.use("/api/projects/:id/routing", requireDepartment("production"),                         routingRouter);
app.use("/api/bom-items",            requireDepartment("production", "procurement", "store"), bomItemsRouter);
app.use("/api/work-centres",         requireDepartment("production"),                         workCentresRouter);
app.use("/api/material-requests",    requireDepartment("procurement", "store"),               materialRequestsRouter);

// ── S-03: QC & Welding routes ─────────────────────────────────
app.use("/api/projects/:id/itp",   requireDepartment("qc"), itpRouter);
app.use("/api/control-plan",       requireDepartment("qc"), controlPlanRouter);
app.use("/api/projects/:id/weld-joints",requireDepartment("welding", "qc"),       weldJointsRouter);
app.use("/api/ncr",         requireDepartment("qc", "welding"),                   ncrRouter);
app.use("/api/inspections", requireDepartment("qc"),                              inspectionsRouter);
app.use("/api/wps",         requireDepartment("welding", "qc"),                   wpsRouter);
app.use("/api/wpq",         requireDepartment("welding", "qc"),                   wpqRouter);

// ── S-10/S-11: GRN + dashboard aggregates ────────────────────
app.use("/api/grn",       requireDepartment("store", "procurement"), grnRouter);
app.use("/api/dashboard", dashboardAggregatesRouter);

// ── S-04: CRM / Finance / HR routes ──────────────────────────
app.use("/api/clients",       requireDepartment("marketing"), clientsRouter);
app.use("/api/opportunities", requireDepartment("marketing"), opportunitiesRouter);
app.use("/api/quotes",        requireDepartment("marketing"), quotesRouter);
app.use("/api/finance",       requireDepartment("finance"),   financeRouter);
app.use("/api", hrRouter); // HR guard applied inside hr.js router

// ── S-05: File storage / parsers / PDF generation ────────────
app.use("/api/uploads", uploadsRouter);
app.use("/api/files", uploadsRouter);
app.use("/api/parse", parseRouter);
app.use("/api", pdfRouter);

// ── S-15: New workflows & modules (NEW-08/10/11/12) ──────────
app.use("/api/projects/:id/comments", projectCommentsRouter); // cross-dept (ADR-005)
app.use("/api/kaizen",              kaizenRouter);             // org-wide improvement — no dept guard
app.use("/api/field-visits",        requireDepartment("marketing"), fieldVisitsRouter);
app.use("/api/customer-complaints", requireDepartment("qc", "marketing"), customerComplaintsRouter);

// ── S-14: HR, Finance & Store (ENH-03/04/05, NEW-05/06/07) ──
app.use("/api/remnants",        requireDepartment("store"),                 remnantsRouter);
app.use("/api/vendors/quality", requireDepartment("qc", "procurement"),     vendorQualityRouter);
// Leave, attendance, expense-claims are employee-level — every dept submits their own;
// HR/Finance approves via requireRole, so no dept gate here.
app.use("/api/leave-requests",  leaveRequestsRouter);
app.use("/api/attendance",      attendanceRouter);
app.use("/api/expense-claims",  expenseClaimsRouter);

// ── S-13: QC enhancements (ENH-01/02/06/07/08) ───────────────
app.use("/api/spc",         requireDepartment("qc"),           spcRouter);
app.use("/api/calibration", requireDepartment("qc"),           calibrationRouter);
app.use("/api/jigs",        requireDepartment("qc", "store"),  jigsRouter);

// ── S-12: Production operations (NEW-01, NEW-02, NEW-03, NEW-09) ──
app.use("/api/labour-hours", requireDepartment("production", "hr"),  labourHoursRouter);
app.use("/api/schedule",     requireDepartment("production"),        scheduleRouter);
app.use("/api/deviations",   requireDepartment("qc", "production"),  deviationsRouter);
app.use("/api/mrp",          requireDepartment("production", "procurement"), mrpRouter);
app.use("/api/machines/:id/downtime", requireDepartment("production"), machineDowntimeRouter);

// ── S-06: IIoT API ────────────────────────────────────────────
app.use("/api/machines", requireDepartment("production"), machinesRouter);
app.use("/api/iot",      requireDepartment("production"), machinesRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Sentry error handler (must be before custom error handler) ──
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Error]", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

module.exports = app;
