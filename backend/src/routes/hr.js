const express = require("express");
const db = require("../db/knex");
const { requireRole, requireDepartment } = require("../middleware/auth");

const router = express.Router();

// All HR data routes are restricted to the HR department (GM bypasses automatically)
const deptGuard = requireDepartment("hr");
router.use(["/employees", "/employees/*", "/hr-certs", "/hr-certs/*", "/training", "/training/*", "/utilisation"], deptGuard);

// GET /employees — full directory with cert and WPQ status summary
router.get("/employees", async (req, res, next) => {
  try {
    const { department, status, search } = req.query;

    let query = db("employees as e")
      .leftJoin("users as u", "e.user_id", "u.id")
      .leftJoin(
        db("hr_certs").where("status", "expiring_soon").orWhere("status", "expired")
          .select("employee_id").count("id as alert_count").groupBy("employee_id").as("cert_alerts"),
        "cert_alerts.employee_id", "e.id"
      )
      .leftJoin(
        db("wpq").whereIn("status", ["expiring_soon", "expired"])
          .select("employee_id").count("id as wpq_alert_count").groupBy("employee_id").as("wpq_alerts"),
        "wpq_alerts.employee_id", "e.id"
      )
      .select(
        "e.*",
        "u.email as system_email",
        "u.role as system_role",
        db.raw("COALESCE(cert_alerts.alert_count, 0) AS cert_alerts"),
        db.raw("COALESCE(wpq_alerts.wpq_alert_count, 0) AS wpq_alerts")
      )
      .orderBy("e.full_name");

    if (department) query = query.where("e.department", department);
    if (status) query = query.where("e.status", status);
    if (search) query = query.whereILike("e.full_name", `%${search}%`);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /employees — add employee
router.post("/employees", requireRole("manager"), async (req, res, next) => {
  try {
    const { employee_no, full_name, position, department, nationality, dob, hire_date, contract_end_date, phone, email } = req.body;
    if (!employee_no || !full_name) return res.status(400).json({ error: "employee_no and full_name are required" });

    const [employee] = await db("employees")
      .insert({ employee_no, full_name, position, department, nationality, dob, hire_date, contract_end_date, phone, email, status: "active" })
      .returning("*");

    res.status(201).json(employee);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "employee_no already exists" });
    next(err);
  }
});

// GET /employees/:id — detail with certs, WPQ, training
router.get("/employees/:id", async (req, res, next) => {
  try {
    const employee = await db("employees as e")
      .leftJoin("users as u", "e.user_id", "u.id")
      .select("e.*", "u.email as system_email", "u.role as system_role")
      .where("e.id", req.params.id)
      .first();

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const [certs, wpqs, training] = await Promise.all([
      db("hr_certs").where("employee_id", req.params.id).orderBy("expiry_date"),
      db("wpq as q").leftJoin("wps as w", "q.wps_id", "w.id")
        .select("q.*", "w.wps_no", "w.process as wps_process")
        .where("q.employee_id", req.params.id).orderBy("q.expiry_date"),
      db("training_records").where("employee_id", req.params.id).orderBy("training_date", "desc"),
    ]);

    res.json({ ...employee, certifications: certs, wpq_qualifications: wpqs, training_records: training });
  } catch (err) {
    next(err);
  }
});

// GET /employees/:id/certs — certifications with expiry
router.get("/employees/:id/certs", async (req, res, next) => {
  try {
    const certs = await db("hr_certs").where("employee_id", req.params.id).orderBy("expiry_date");
    res.json(certs);
  } catch (err) {
    next(err);
  }
});

// POST /hr-certs — add certification record
router.post("/hr-certs", requireRole("manager"), async (req, res, next) => {
  try {
    const { employee_id, cert_name, cert_no, issuing_body, issue_date, expiry_date } = req.body;
    if (!employee_id || !cert_name) return res.status(400).json({ error: "employee_id and cert_name are required" });

    // Determine status based on expiry
    const now = new Date();
    const warn = new Date(now);
    warn.setDate(warn.getDate() + 90);
    const expiry = expiry_date ? new Date(expiry_date) : null;
    const status = !expiry ? "active" : expiry < now ? "expired" : expiry < warn ? "expiring_soon" : "active";

    const [cert] = await db("hr_certs")
      .insert({ employee_id, cert_name, cert_no, issuing_body, issue_date, expiry_date, status })
      .returning("*");

    res.status(201).json(cert);
  } catch (err) {
    next(err);
  }
});

// PATCH /hr-certs/:id/renew — update with new expiry date
router.patch("/hr-certs/:id/renew", requireRole("manager"), async (req, res, next) => {
  try {
    const { expiry_date, cert_no, issue_date } = req.body;
    if (!expiry_date) return res.status(400).json({ error: "expiry_date is required" });

    const now = new Date();
    const warn = new Date(now);
    warn.setDate(warn.getDate() + 90);
    const expiry = new Date(expiry_date);
    const status = expiry < now ? "expired" : expiry < warn ? "expiring_soon" : "active";

    const updates = { expiry_date, status, updated_at: db.fn.now() };
    if (cert_no) updates.cert_no = cert_no;
    if (issue_date) updates.issue_date = issue_date;

    const [updated] = await db("hr_certs").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Certification not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /training — training records
router.get("/training", async (req, res, next) => {
  try {
    const { employee_id, result } = req.query;

    let query = db("training_records as t")
      .leftJoin("employees as e", "t.employee_id", "e.id")
      .select("t.*", "e.full_name as employee_name", "e.employee_no")
      .orderBy("t.training_date", "desc");

    if (employee_id) query = query.where("t.employee_id", employee_id);
    if (result) query = query.where("t.result", result);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /training — log training session
router.post("/training", requireRole("manager"), async (req, res, next) => {
  try {
    const { employee_id, training_name, provider, training_date, duration_hours, cert_ref } = req.body;
    if (!employee_id || !training_name) return res.status(400).json({ error: "employee_id and training_name are required" });

    const [record] = await db("training_records")
      .insert({ employee_id, training_name, provider, training_date, duration_hours, result: "in_progress", cert_ref })
      .returning("*");

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// PATCH /training/:id/complete — mark complete with result
router.patch("/training/:id/complete", requireRole("manager"), async (req, res, next) => {
  try {
    const { result, cert_ref } = req.body;
    if (!["pass", "fail"].includes(result)) return res.status(400).json({ error: "result must be pass or fail" });

    const updates = { result, updated_at: db.fn.now() };
    if (cert_ref) updates.cert_ref = cert_ref;

    const [updated] = await db("training_records").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Training record not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /utilisation — labour utilisation report (routing_steps actual vs planned hours per employee)
router.get("/utilisation", requireRole("manager"), async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const rows = await db.raw(`
      SELECT
        e.id,
        e.full_name,
        e.employee_no,
        e.department,
        COUNT(DISTINCT j.id)                    AS joints_welded,
        COUNT(DISTINCT t.id)                    AS training_sessions,
        COUNT(DISTINCT q.id)                    AS active_qualifications,
        SUM(CASE WHEN q.status = 'active' THEN 1 ELSE 0 END) AS valid_wpqs
      FROM employees e
      LEFT JOIN weld_joints j ON j.welder_id = e.id
        ${from ? `AND j.weld_date >= '${from}'` : ""}
        ${to   ? `AND j.weld_date <= '${to}'`   : ""}
      LEFT JOIN training_records t ON t.employee_id = e.id
      LEFT JOIN wpq q ON q.employee_id = e.id
      WHERE e.status = 'active'
      GROUP BY e.id, e.full_name, e.employee_no, e.department
      ORDER BY e.department, e.full_name
    `);

    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
