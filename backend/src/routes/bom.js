const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { calculateMRP } = require("../services/mrp");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router({ mergeParams: true }); // mergeParams for /projects/:id/bom

// GET /projects/:id/bom — full recursive BOM tree via CTE
router.get("/", async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Recursive CTE: builds parent→children path in one round-trip
    const rows = await db.raw(`
      WITH RECURSIVE bom_tree AS (
        -- Anchor: top-level items (no parent)
        SELECT
          id, project_id, parent_id, pn, description,
          quantity, unit, material, heat_no, item_type, stock_status,
          0 AS depth,
          ARRAY[id] AS path
        FROM bom_items
        WHERE project_id = ? AND parent_id IS NULL

        UNION ALL

        -- Recursive: children of each node
        SELECT
          b.id, b.project_id, b.parent_id, b.pn, b.description,
          b.quantity, b.unit, b.material, b.heat_no, b.item_type, b.stock_status,
          t.depth + 1,
          t.path || b.id
        FROM bom_items b
        JOIN bom_tree t ON b.parent_id = t.id
        WHERE t.depth < 10  -- guard against circular references
      )
      SELECT * FROM bom_tree ORDER BY path
    `, [projectId]);

    // Build nested tree from flat rows
    const flat = rows.rows;
    const nodeMap = {};
    flat.forEach((r) => (nodeMap[r.id] = { ...r, children: [] }));
    const roots = [];
    flat.forEach((r) => {
      if (r.parent_id && nodeMap[r.parent_id]) {
        nodeMap[r.parent_id].children.push(nodeMap[r.id]);
      } else {
        roots.push(nodeMap[r.id]);
      }
    });

    res.json({ project_id: projectId, bom: roots, total_items: flat.length });
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/bom — add top-level assembly
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const { pn, description, quantity, unit, material, item_type } = req.body;
    if (!description || !quantity) {
      return res.status(400).json({ error: "description and quantity are required" });
    }

    const [item] = await db("bom_items")
      .insert({
        project_id: req.params.id,
        parent_id: null,
        pn: pn || null,
        description,
        quantity: Number(quantity),
        unit: unit || null,
        material: material || null,
        item_type: item_type || "assembly",
      })
      .returning("*");

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/mrp — MRP calculation (also fires BOQ_GENERATED event to Procurement + Store)
router.get("/mrp", async (req, res, next) => {
  try {
    const result = await calculateMRP(req.params.id);
    const shortages = result.filter((r) => r.status === "short");

    // Notify Procurement and Store that the BOQ/schedule is ready for action
    await publish(TOPICS.BOQ_GENERATED, {
      projectId: req.params.id,
      totalItems: result.length,
      shortageCount: shortages.length,
      requestedBy: req.user?.sub,
    }).catch((e) => console.warn("[BOM] BOQ_GENERATED publish failed:", e.message));

    res.json({
      project_id: req.params.id,
      items: result,
      summary: {
        total_line_items: result.length,
        shortage_count: shortages.length,
        ok_count: result.length - shortages.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
