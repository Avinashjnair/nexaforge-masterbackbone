const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router();

// POST /inspections — create inspection record from a GRN
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const { grn_id, project_id, notes } = req.body;
    if (!grn_id) return res.status(400).json({ error: "grn_id is required" });

    const grn = await db("grn").where("id", grn_id).first();
    if (!grn) return res.status(404).json({ error: "GRN not found" });

    // Update GRN inspection status to in_progress
    await db("grn").where("id", grn_id).update({ inspection_status: "in_progress", updated_at: db.fn.now() });

    // Return GRN with its lines as the inspection context
    const lines = await db("grn_lines").where("grn_id", grn_id);

    res.status(201).json({
      grn_id,
      project_id: project_id || null,
      status: "in_progress",
      lines,
      notes: notes || null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /inspections — list pending / in-progress inspections
router.get("/", async (req, res, next) => {
  try {
    const { status = "pending", project_id } = req.query;

    let query = db("grn as g")
      .leftJoin("purchase_orders as po", "g.po_id", "po.id")
      .leftJoin("projects as p", "po.project_id", "p.id")
      .select(
        "g.id", "g.grn_no", "g.received_date", "g.inspection_status",
        "g.delivery_note_no", "g.remarks",
        "po.po_no", "p.project_no", "p.name as project_name"
      )
      .where("g.inspection_status", status)
      .orderBy("g.received_date", "desc");

    if (project_id) query = query.where("p.id", project_id);

    const inspections = await query;
    res.json(inspections);
  } catch (err) {
    next(err);
  }
});

// POST /inspections/:id/result — log pass/fail on a GRN
router.post("/:id/result", requireRole("senior"), async (req, res, next) => {
  try {
    const { result, remarks } = req.body;
    const VALID = ["accepted", "rejected", "partially_accepted"];
    if (!VALID.includes(result)) {
      return res.status(400).json({ error: `result must be one of: ${VALID.join(", ")}` });
    }

    const grn = await db("grn").where("id", req.params.id).first();
    if (!grn) return res.status(404).json({ error: "GRN / inspection not found" });

    const [updated] = await db("grn")
      .where("id", req.params.id)
      .update({
        inspection_status: result,
        remarks: remarks || grn.remarks,
        updated_at: db.fn.now(),
      })
      .returning("*");

    if (result === "rejected") {
      await db("grn_lines")
        .where("grn_id", req.params.id)
        .update({ condition: "rejected", updated_at: db.fn.now() });
    }

    // Accepted or partially accepted → notify Store to release to stock
    if (result === "accepted" || result === "partially_accepted") {
      await publish(TOPICS.INSPECTION_PASSED, {
        grnId: req.params.id,
        result,
        projectId: grn.project_id || null,
        passedBy: req.user.sub,
      }).catch((e) => console.warn("[Inspection] publish failed:", e.message));
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
