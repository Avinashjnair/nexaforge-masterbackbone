const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// Two-letter initials from a name, e.g. "Jane Roe" -> "JR".
function initialsFrom(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// GET /crm/contacts — optional company filter and follow-up-due flag
router.get("/", async (req, res, next) => {
  try {
    const { company, due } = req.query;
    let query = db("crm_contacts").orderBy("name", "asc");
    if (company) query = query.where("company", company);
    if (due === "true") query = query.whereNotNull("follow_up_due").andWhere("follow_up_due", "<=", db.fn.now());
    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /crm/contacts/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await db("crm_contacts").where("id", req.params.id).first();
    if (!row) return res.status(404).json({ error: "Contact not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /crm/contacts
router.post("/", requireRole("user"), async (req, res, next) => {
  try {
    const { ref, name, title, company, email, phone, last_contact, follow_up_due, follow_up_note, avatar_bg, initials } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const [row] = await db("crm_contacts")
      .insert({
        ref: ref || null,
        name,
        title: title || null,
        company: company || null,
        email: email || null,
        phone: phone || null,
        last_contact: last_contact || null,
        follow_up_due: follow_up_due || null,
        follow_up_note: follow_up_note || null,
        avatar_bg: avatar_bg || null,
        initials: initials || initialsFrom(name),
      })
      .returning("*");

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PATCH /crm/contacts/:id
router.patch("/:id", requireRole("user"), async (req, res, next) => {
  try {
    const allowed = ["ref", "name", "title", "company", "email", "phone", "last_contact", "follow_up_due", "follow_up_note", "avatar_bg", "initials"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });

    updates.updated_at = db.fn.now();
    const [updated] = await db("crm_contacts").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "Contact not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /crm/contacts/:id
router.delete("/:id", requireRole("user"), async (req, res, next) => {
  try {
    const deleted = await db("crm_contacts").where("id", req.params.id).del();
    if (!deleted) return res.status(404).json({ error: "Contact not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
