const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { signOffStep, hasActiveHoldBlock } = require("../services/itpEngine");

const router = express.Router({ mergeParams: true });

const VALID_CODES = ["P", "R", "W", "H"];
function validCode(c) { return !c || VALID_CODES.includes(c); }

// GET /projects/:id/itp — all ITP steps with sign-offs
router.get("/", async (req, res, next) => {
  try {
    const steps = await db("itp_steps")
      .where("project_id", req.params.id)
      .orderBy("step_no");

    const stepIds = steps.map((s) => s.id);
    const signOffs = stepIds.length
      ? await db("itp_sign_offs as so")
          .leftJoin("users as u", "so.signed_by", "u.id")
          .whereIn("so.itp_step_id", stepIds)
          .select("so.*", "u.full_name as inspector_name")
          .orderBy("so.signed_at")
      : [];

    const signOffsByStep = {};
    signOffs.forEach((s) => {
      (signOffsByStep[s.itp_step_id] = signOffsByStep[s.itp_step_id] || []).push(s);
    });

    const activeHolds = await hasActiveHoldBlock(req.params.id);

    res.json({
      project_id: req.params.id,
      steps: steps.map((s) => ({ ...s, sign_offs: signOffsByStep[s.id] || [] })),
      active_hold_count: activeHolds.length,
      active_holds: activeHolds,
    });
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/itp/steps/:stepId — single step detail
router.get("/steps/:stepId", async (req, res, next) => {
  try {
    const step = await db("itp_steps").where("id", req.params.stepId).first();
    if (!step) return res.status(404).json({ error: "ITP step not found" });

    const signOffs = await db("itp_sign_offs as so")
      .leftJoin("users as u", "so.signed_by", "u.id")
      .where("so.itp_step_id", step.id)
      .select("so.*", "u.full_name as inspector_name")
      .orderBy("so.signed_at");

    res.json({ ...step, sign_offs: signOffs });
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/itp — add ITP step
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const {
      step_no, activity, hold_type, reference_doc,
      parameters, responsible,
      internal_code = "P", customer_code, tpi_code,
      remarks,
    } = req.body;

    if (!activity)
      return res.status(400).json({ error: "activity is required" });
    if (!VALID_CODES.includes(internal_code))
      return res.status(400).json({ error: "internal_code must be P, R, W, or H" });
    if (!validCode(customer_code) || !validCode(tpi_code))
      return res.status(400).json({ error: "customer_code and tpi_code must be P/R/W/H or null" });

    // hold_type kept for legacy compatibility; default to internal_code if not provided
    const resolvedHoldType = hold_type || internal_code;
    if (!["H", "W", "R", "S", "P"].includes(resolvedHoldType))
      return res.status(400).json({ error: "hold_type must be H, W, R, S, or P" });

    let stepNo = step_no;
    if (!stepNo) {
      const [{ max }] = await db("itp_steps")
        .where("project_id", req.params.id)
        .max("step_no as max");
      stepNo = (max || 0) + 1;
    }

    const [step] = await db("itp_steps")
      .insert({
        project_id: req.params.id,
        step_no: stepNo,
        activity,
        hold_type: resolvedHoldType,
        reference_doc: reference_doc || null,
        parameters: parameters || null,
        responsible: responsible || null,
        internal_code,
        customer_code: customer_code || null,
        tpi_code: tpi_code || null,
        remarks: remarks || null,
        status: "pending",
        is_hold_active: false,
      })
      .returning("*");

    res.status(201).json(step);
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/itp/steps/:stepId/signoff — sign off a step for a specific party
router.post("/steps/:stepId/signoff", requireRole("senior"), async (req, res, next) => {
  try {
    const { result, comments, party = "internal" } = req.body;

    if (!["approved", "rejected", "conditional"].includes(result))
      return res.status(400).json({ error: "result must be approved, rejected, or conditional" });
    if (!["internal", "customer", "tpi"].includes(party))
      return res.status(400).json({ error: "party must be internal, customer, or tpi" });

    const data = await signOffStep(
      req.params.stepId,
      req.user.sub,
      req.user.role,
      result,
      comments,
      party
    );

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
