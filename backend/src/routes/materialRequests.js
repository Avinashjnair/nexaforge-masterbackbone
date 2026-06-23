const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// GET /material-requests — list, optionally filter by project
router.get("/", async (req, res, next) => {
  try {
    const { project_id, status } = req.query;
    let query = db("material_requests as mr")
      .leftJoin("projects as p", "mr.project_id", "p.id")
      .leftJoin("employees as e", "mr.requested_by", "e.id")
      .select("mr.*", "p.project_no", "p.name as project_name", "e.full_name as requested_by_name")
      .orderBy("mr.created_at", "desc");

    if (project_id) query = query.where("mr.project_id", project_id);
    if (status) query = query.where("mr.status", status);

    const mrs = await query;

    // Attach lines
    const mrIds = mrs.map((m) => m.id);
    const lines = mrIds.length
      ? await db("material_request_lines").whereIn("mr_id", mrIds)
      : [];

    const linesByMr = {};
    lines.forEach((l) => {
      (linesByMr[l.mr_id] = linesByMr[l.mr_id] || []).push(l);
    });

    res.json(mrs.map((m) => ({ ...m, lines: linesByMr[m.id] || [] })));
  } catch (err) {
    next(err);
  }
});

// POST /material-requests — raise MR from production
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { project_id, notes, lines } = req.body;
    if (!project_id || !lines?.length) {
      return res.status(400).json({ error: "project_id and at least one line item are required" });
    }

    // Auto-generate MR number
    const [{ count }] = await db("material_requests").count("id as count");
    const mrNo = `MR-${String(Number(count) + 1).padStart(4, "0")}`;

    const [mr] = await db("material_requests")
      .insert({
        project_id,
        requested_by: req.user.sub ? await resolveEmployeeId(req.user.sub) : null,
        mr_no: mrNo,
        status: "submitted",
        notes: notes || null,
      })
      .returning("*");

    const lineRows = lines.map((l, idx) => ({
      mr_id: mr.id,
      bom_item_id: l.bom_item_id || null,
      description: l.description,
      qty_requested: Number(l.qty_requested),
      qty_issued: 0,
      unit: l.unit || null,
    }));

    const insertedLines = await db("material_request_lines").insert(lineRows).returning("*");

    await publish(TOPICS.MATERIAL_REQUEST_RAISED, {
      mrId: mr.id,
      mrNo: mr.mr_no,
      projectId: mr.project_id,
      lineCount: insertedLines.length,
    });

    res.status(201).json({ ...mr, lines: insertedLines });
  } catch (err) {
    next(err);
  }
});

// PATCH /material-requests/:id/status
router.patch("/:id/status", requireRole("manager"), async (req, res, next) => {
  try {
    const VALID = ["draft", "submitted", "approved", "issued", "cancelled"];
    const { status } = req.body;
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID.join(", ")}` });
    }

    const [updated] = await db("material_requests")
      .where("id", req.params.id)
      .update({ status, updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "Material request not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

async function resolveEmployeeId(userId) {
  const emp = await db("employees").where("user_id", userId).first();
  return emp?.id || null;
}

module.exports = router;
