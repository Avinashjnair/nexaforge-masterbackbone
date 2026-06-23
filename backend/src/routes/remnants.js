const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /remnants — searchable remnant library
router.get("/", async (req, res, next) => {
  try {
    const { material, status = "available", project_id, search } = req.query;

    let query = db("remnant_stock as rs")
      .leftJoin("projects as sp", "rs.source_project_id",   "sp.id")
      .leftJoin("projects as rp", "rs.reserved_project_id", "rp.id")
      .leftJoin("inventory_items as ii", "rs.parent_item_id", "ii.id")
      .select(
        "rs.*",
        "sp.project_no as source_project_no",
        "rp.project_no as reserved_project_no",
        "ii.item_code as parent_item_code"
      )
      .orderBy("rs.created_at", "desc");

    if (status)     query = query.where("rs.status", status);
    if (material)   query = query.whereILike("rs.material", `%${material}%`);
    if (project_id) query = query.where("rs.source_project_id", project_id);
    if (search)     query = query.where(function () {
      this.whereILike("rs.material", `%${search}%`)
          .orWhereILike("rs.heat_no",   `%${search}%`)
          .orWhereILike("rs.dimensions",`%${search}%`);
    });

    res.json(await query);
  } catch (err) {
    next(err);
  }
});

// GET /remnants/:id
router.get("/:id", async (req, res, next) => {
  try {
    const row = await db("remnant_stock as rs")
      .leftJoin("projects as sp", "rs.source_project_id",   "sp.id")
      .leftJoin("projects as rp", "rs.reserved_project_id", "rp.id")
      .select("rs.*", "sp.project_no as source_project_no", "rp.project_no as reserved_project_no")
      .where("rs.id", req.params.id)
      .first();

    if (!row) return res.status(404).json({ error: "Remnant not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// POST /remnants — log a new remnant piece
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const { parent_item_id, heat_no, material, dimensions, weight_kg, source_project_id, location } = req.body;

    if (!material) return res.status(400).json({ error: "material is required" });

    const [remnant] = await db("remnant_stock")
      .insert({
        parent_item_id:   parent_item_id   || null,
        heat_no:          heat_no          || null,
        material,
        dimensions:       dimensions       || null,
        weight_kg:        weight_kg        || null,
        source_project_id:source_project_id|| null,
        location:         location         || null,
        status:           "available",
        created_by:       req.user.sub,
      })
      .returning("*");

    res.status(201).json(remnant);
  } catch (err) {
    next(err);
  }
});

// PATCH /remnants/:id/reserve — reserve a remnant for a project
router.patch("/:id/reserve", requireRole("senior"), async (req, res, next) => {
  try {
    const { project_id } = req.body;
    if (!project_id) return res.status(400).json({ error: "project_id is required" });

    const remnant = await db("remnant_stock").where("id", req.params.id).first();
    if (!remnant) return res.status(404).json({ error: "Remnant not found" });
    if (remnant.status !== "available") {
      return res.status(409).json({ error: `Remnant is not available (current status: ${remnant.status})` });
    }

    const [updated] = await db("remnant_stock")
      .where("id", req.params.id)
      .update({ status: "reserved", reserved_project_id: project_id, updated_at: db.fn.now() })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /remnants/:id/scrap — mark as scrapped
router.patch("/:id/scrap", requireRole("senior"), async (req, res, next) => {
  try {
    const [updated] = await db("remnant_stock")
      .where("id", req.params.id)
      .update({ status: "scrapped", updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "Remnant not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
