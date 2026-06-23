const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /bom-items/:id/children — add child item to an assembly
router.post("/:id/children", requireRole("senior"), async (req, res, next) => {
  try {
    const parent = await db("bom_items").where("id", req.params.id).first();
    if (!parent) return res.status(404).json({ error: "Parent BOM item not found" });

    const { pn, description, quantity, unit, material, heat_no, item_type } = req.body;
    if (!description || !quantity) {
      return res.status(400).json({ error: "description and quantity are required" });
    }

    const [child] = await db("bom_items")
      .insert({
        project_id: parent.project_id,
        parent_id: parent.id,
        pn: pn || null,
        description,
        quantity: Number(quantity),
        unit: unit || null,
        material: material || null,
        heat_no: heat_no || null,
        item_type: item_type || "part",
      })
      .returning("*");

    res.status(201).json(child);
  } catch (err) {
    next(err);
  }
});

// PATCH /bom-items/:id — update qty, material, part number
router.patch("/:id", requireRole("senior"), async (req, res, next) => {
  try {
    const allowed = ["pn", "description", "quantity", "unit", "material", "heat_no", "item_type", "stock_status"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }
    updates.updated_at = db.fn.now();

    const [updated] = await db("bom_items").where("id", req.params.id).update(updates).returning("*");
    if (!updated) return res.status(404).json({ error: "BOM item not found" });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /bom-items/:id — removes item and all descendants (CASCADE in DB)
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const rows = await db("bom_items").where("id", req.params.id).del();
    if (!rows) return res.status(404).json({ error: "BOM item not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
