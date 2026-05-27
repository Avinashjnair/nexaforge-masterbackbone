const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const VALID_CATEGORIES = ["Travel", "Accommodation", "Tools", "Meals", "Stationery", "Other"];
const VALID_STATUSES   = ["draft", "submitted", "approved", "rejected", "paid"];

// POST /expense-claims — create a draft claim
router.post("/", async (req, res, next) => {
  try {
    const { employee_id, expense_date, category, amount, currency, description, receipt_file_id } = req.body;

    if (!employee_id || !expense_date || !category || !amount || !description) {
      return res.status(400).json({ error: "employee_id, expense_date, category, amount, and description are required" });
    }
    if (Number(amount) <= 0) return res.status(400).json({ error: "amount must be positive" });

    const [claim] = await db("expense_claims")
      .insert({
        employee_id,
        expense_date,
        category,
        amount:           Number(amount),
        currency:         currency        || "USD",
        description,
        receipt_file_id:  receipt_file_id || null,
        status:           "draft",
      })
      .returning("*");

    res.status(201).json(claim);
  } catch (err) {
    next(err);
  }
});

// PATCH /expense-claims/:id/submit — employee submits for approval
router.patch("/:id/submit", async (req, res, next) => {
  try {
    const claim = await db("expense_claims").where("id", req.params.id).first();
    if (!claim) return res.status(404).json({ error: "Expense claim not found" });
    if (claim.status !== "draft") {
      return res.status(409).json({ error: `Cannot submit a claim in status: ${claim.status}` });
    }

    const [updated] = await db("expense_claims")
      .where("id", req.params.id)
      .update({ status: "submitted", updated_at: db.fn.now() })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /expense-claims — list with filters
router.get("/", async (req, res, next) => {
  try {
    const { employee_id, status, from, to, limit = 50, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db("expense_claims as ec")
      .leftJoin("employees as e",    "ec.employee_id",      "e.id")
      .leftJoin("users as hu",       "ec.hr_approved_by",   "hu.id")
      .leftJoin("users as fu",       "ec.finance_paid_by",  "fu.id")
      .leftJoin("files as f",        "ec.receipt_file_id",  "f.id")
      .select(
        "ec.*",
        "e.full_name as employee_name", "e.employee_no", "e.department",
        "hu.full_name as hr_approver_name",
        "fu.full_name as finance_payer_name",
        "f.original_name as receipt_filename"
      )
      .orderBy("ec.created_at", "desc")
      .limit(Number(limit))
      .offset(offset);

    if (employee_id) query = query.where("ec.employee_id", employee_id);
    if (status)      query = query.where("ec.status", status);
    if (from)        query = query.where("ec.expense_date", ">=", from);
    if (to)          query = query.where("ec.expense_date", "<=", to);

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /expense-claims/:id
router.get("/:id", async (req, res, next) => {
  try {
    const claim = await db("expense_claims as ec")
      .leftJoin("employees as e",   "ec.employee_id",     "e.id")
      .leftJoin("users as hu",      "ec.hr_approved_by",  "hu.id")
      .leftJoin("users as fu",      "ec.finance_paid_by", "fu.id")
      .leftJoin("files as f",       "ec.receipt_file_id", "f.id")
      .select(
        "ec.*",
        "e.full_name as employee_name", "e.employee_no",
        "hu.full_name as hr_approver_name",
        "fu.full_name as finance_payer_name",
        "f.original_name as receipt_filename", "f.storage_key as receipt_storage_key"
      )
      .where("ec.id", req.params.id)
      .first();

    if (!claim) return res.status(404).json({ error: "Expense claim not found" });
    res.json(claim);
  } catch (err) {
    next(err);
  }
});

// PATCH /expense-claims/:id/approve — HR approves or rejects
router.patch("/:id/approve", requireRole("manager"), async (req, res, next) => {
  try {
    const { approve, hr_notes } = req.body;
    if (approve === undefined) return res.status(400).json({ error: "approve (boolean) is required" });

    const claim = await db("expense_claims").where("id", req.params.id).first();
    if (!claim) return res.status(404).json({ error: "Expense claim not found" });
    if (claim.status !== "submitted") {
      return res.status(409).json({ error: `Cannot approve a claim in status: ${claim.status}` });
    }

    const [updated] = await db("expense_claims")
      .where("id", req.params.id)
      .update({
        status:          approve ? "approved" : "rejected",
        hr_approved_by:  req.user.sub,
        hr_decided_at:   db.fn.now(),
        hr_notes:        hr_notes || null,
        updated_at:      db.fn.now(),
      })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /expense-claims/:id/pay — Finance marks as paid
router.patch("/:id/pay", requireRole("manager"), async (req, res, next) => {
  try {
    const claim = await db("expense_claims").where("id", req.params.id).first();
    if (!claim) return res.status(404).json({ error: "Expense claim not found" });
    if (claim.status !== "approved") {
      return res.status(409).json({ error: `Can only mark approved claims as paid (current: ${claim.status})` });
    }

    const [updated] = await db("expense_claims")
      .where("id", req.params.id)
      .update({
        status:           "paid",
        finance_paid_by:  req.user.sub,
        paid_at:          db.fn.now(),
        updated_at:       db.fn.now(),
      })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
