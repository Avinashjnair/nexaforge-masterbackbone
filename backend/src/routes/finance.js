const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { getJobCostSummary } = require("../services/jobCosting");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// ── Job Costing ───────────────────────────────────────────────

// GET /projects/:id/job-cost — full cost breakdown
router.get("/projects/:id/job-cost", async (req, res, next) => {
  try {
    const summary = await getJobCostSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// POST /job-cost-lines — add actual cost entry
router.post("/job-cost-lines", requireRole("senior"), async (req, res, next) => {
  try {
    const { project_id, cost_type, description, budgeted_amount, actual_amount, cost_code, po_id } = req.body;
    if (!project_id || !cost_type || !description) {
      return res.status(400).json({ error: "project_id, cost_type and description are required" });
    }

    const VALID_TYPES = ["material", "labour", "overhead", "subcontract", "other"];
    if (!VALID_TYPES.includes(cost_type)) {
      return res.status(400).json({ error: `cost_type must be one of: ${VALID_TYPES.join(", ")}` });
    }

    const [line] = await db("job_cost_lines")
      .insert({ project_id, cost_type, description, budgeted_amount, actual_amount, cost_code, po_id })
      .returning("*");

    res.status(201).json(line);
  } catch (err) {
    next(err);
  }
});

// PATCH /job-cost-lines/:id — update actual or budgeted amount
router.patch("/job-cost-lines/:id", requireRole("senior"), async (req, res, next) => {
  try {
    const allowed = ["description", "budgeted_amount", "actual_amount", "cost_code"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (!Object.keys(updates).length) return res.status(400).json({ error: "No updatable fields provided" });
    updates.updated_at = db.fn.now();

    const [updated] = await db("job_cost_lines").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Cost line not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── AR Invoices ───────────────────────────────────────────────

// GET /invoices — AR ledger
router.get("/invoices", async (req, res, next) => {
  try {
    const { status, project_id, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("invoices as i")
      .leftJoin("projects as p", "i.project_id", "p.id")
      .leftJoin("milestones as m", "i.milestone_id", "m.id")
      .select("i.*", "p.project_no", "p.name as project_name", "m.name as milestone_name")
      .orderBy("i.issue_date", "desc")
      .limit(Number(limit)).offset(offset);

    if (status) query = query.where("i.status", status);
    if (project_id) query = query.where("i.project_id", project_id);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// POST /invoices — create invoice (optionally from milestone)
router.post("/invoices", requireRole("manager"), async (req, res, next) => {
  try {
    const { project_id, milestone_id, amount, tax_amount, currency, issue_date, due_date, notes } = req.body;
    if (!project_id || !amount || !issue_date || !due_date) {
      return res.status(400).json({ error: "project_id, amount, issue_date, and due_date are required" });
    }

    const [{ count }] = await db("invoices").count("id as count");
    const invoiceNo = `INV-${String(Number(count) + 1).padStart(5, "0")}`;

    const [invoice] = await db("invoices")
      .insert({
        project_id, milestone_id: milestone_id || null,
        invoice_no: invoiceNo, status: "draft",
        amount, tax_amount: tax_amount || 0,
        paid_amount: 0, currency: currency || "USD",
        issue_date, due_date, notes: notes || null,
      })
      .returning("*");

    // Mark milestone as invoiced
    if (milestone_id) {
      await db("milestones").where("id", milestone_id).update({ status: "invoiced", updated_at: db.fn.now() });
    }

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// PATCH /invoices/:id/status — update invoice status
router.patch("/invoices/:id/status", requireRole("manager"), async (req, res, next) => {
  try {
    const VALID = ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"];
    const { status, paid_amount, paid_date } = req.body;
    if (!VALID.includes(status)) return res.status(400).json({ error: `status must be one of: ${VALID.join(", ")}` });

    const updates = { status, updated_at: db.fn.now() };
    if (paid_amount !== undefined) updates.paid_amount = paid_amount;
    if (paid_date) updates.paid_date = paid_date;

    const [updated] = await db("invoices").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Invoice not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── AP Invoices ───────────────────────────────────────────────

// GET /accounts-payable — AP ledger
router.get("/accounts-payable", async (req, res, next) => {
  try {
    const { status, project_id } = req.query;

    let query = db("ap_invoices as ap")
      .leftJoin("projects as p", "ap.project_id", "p.id")
      .leftJoin("purchase_orders as po", "ap.po_id", "po.id")
      .select("ap.*", "p.project_no", "po.po_no")
      .orderBy("ap.due_date");

    if (status) query = query.where("ap.status", status);
    if (project_id) query = query.where("ap.project_id", project_id);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// PATCH /accounts-payable/:id/pay — mark AP invoice paid
router.patch("/accounts-payable/:id/pay", requireRole("manager"), async (req, res, next) => {
  try {
    const { paid_date } = req.body;

    const [updated] = await db("ap_invoices")
      .where("id", req.params.id)
      .update({ status: "paid", paid_date: paid_date || db.fn.now(), updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "AP invoice not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── Milestones ────────────────────────────────────────────────

// GET /projects/:id/milestones — billing schedule
router.get("/projects/:id/milestones", async (req, res, next) => {
  try {
    const milestones = await db("milestones")
      .where("project_id", req.params.id)
      .orderBy("target_date");
    res.json(milestones);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/milestones — add milestone
router.post("/projects/:id/milestones", requireRole("manager"), async (req, res, next) => {
  try {
    const { name, billing_pct, billing_amount, target_date } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const [milestone] = await db("milestones")
      .insert({ project_id: req.params.id, name, billing_pct, billing_amount, target_date, status: "pending" })
      .returning("*");

    res.status(201).json(milestone);
  } catch (err) {
    next(err);
  }
});

// PATCH /milestones/:id/invoice — trigger milestone and create draft invoice
router.patch("/milestones/:id/invoice", requireRole("manager"), async (req, res, next) => {
  try {
    const milestone = await db("milestones").where("id", req.params.id).first();
    if (!milestone) return res.status(404).json({ error: "Milestone not found" });
    if (milestone.status === "invoiced") return res.status(409).json({ error: "Milestone already invoiced" });

    const project = await db("projects").where("id", milestone.project_id).first();

    await db("milestones").where("id", req.params.id).update({ status: "triggered", updated_at: db.fn.now() });

    await publish(TOPICS.MILESTONE_TRIGGERED, {
      milestoneId: milestone.id,
      projectId: milestone.project_id,
      billingAmount: milestone.billing_amount,
    }).catch((e) => console.warn("[Milestone] publish failed:", e.message));

    // Auto-create draft invoice
    const [{ count }] = await db("invoices").count("id as count");
    const invoiceNo = `INV-${String(Number(count) + 1).padStart(5, "0")}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const [invoice] = await db("invoices")
      .insert({
        project_id: milestone.project_id,
        milestone_id: milestone.id,
        invoice_no: invoiceNo,
        status: "draft",
        amount: milestone.billing_amount || 0,
        tax_amount: 0,
        paid_amount: 0,
        currency: project?.currency || "USD",
        issue_date: new Date(),
        due_date: dueDate,
      })
      .returning("*");

    res.json({ milestone: { ...milestone, status: "triggered" }, invoice });
  } catch (err) {
    next(err);
  }
});

// ── Cash Flow ─────────────────────────────────────────────────

// GET /cash-flow — monthly inflow/outflow aggregation
router.get("/cash-flow", requireRole("manager"), async (req, res, next) => {
  try {
    const { months = 12 } = req.query;

    const [inflows, outflows] = await Promise.all([
      db.raw(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', issue_date), 'YYYY-MM') AS month,
          SUM(amount) AS invoiced,
          SUM(paid_amount) AS collected
        FROM invoices
        WHERE issue_date >= NOW() - INTERVAL '${Number(months)} months'
          AND status NOT IN ('cancelled')
        GROUP BY DATE_TRUNC('month', issue_date)
        ORDER BY DATE_TRUNC('month', issue_date)
      `),
      db.raw(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', COALESCE(paid_date, due_date)), 'YYYY-MM') AS month,
          SUM(amount) AS committed,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid
        FROM ap_invoices
        WHERE COALESCE(paid_date, due_date) >= NOW() - INTERVAL '${Number(months)} months'
          AND status NOT IN ('cancelled')
        GROUP BY DATE_TRUNC('month', COALESCE(paid_date, due_date))
        ORDER BY DATE_TRUNC('month', COALESCE(paid_date, due_date))
      `),
    ]);

    // Merge months into unified cash flow view
    const monthMap = {};
    inflows.rows.forEach((r) => {
      monthMap[r.month] = { month: r.month, ar_invoiced: Number(r.invoiced), ar_collected: Number(r.collected), ap_committed: 0, ap_paid: 0 };
    });
    outflows.rows.forEach((r) => {
      if (!monthMap[r.month]) monthMap[r.month] = { month: r.month, ar_invoiced: 0, ar_collected: 0 };
      monthMap[r.month].ap_committed = Number(r.committed);
      monthMap[r.month].ap_paid = Number(r.paid);
    });

    const cashFlow = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        ...m,
        net_cash: (m.ar_collected || 0) - (m.ap_paid || 0),
      }));

    res.json(cashFlow);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
