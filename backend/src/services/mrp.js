const db = require("../db/knex");

/**
 * MRP calculation for a project.
 * Returns each BOM leaf item with required qty vs on-hand qty and shortage flag.
 */
async function calculateMRP(projectId) {
  // Fetch all BOM items for the project (flat list — tree built client-side if needed)
  const bomItems = await db("bom_items")
    .where({ project_id: projectId })
    .whereNull("parent_id") // top-level assemblies
    .select("*");

  const allItems = await db("bom_items")
    .where({ project_id: projectId })
    .select("*");

  // Index by id for fast child lookup
  const byId = {};
  allItems.forEach((i) => (byId[i.id] = { ...i, children: [] }));
  const roots = [];
  allItems.forEach((i) => {
    if (i.parent_id) {
      byId[i.parent_id]?.children.push(byId[i.id]);
    } else {
      roots.push(byId[i.id]);
    }
  });

  // Collect leaf-level items (parts / materials with no children)
  const leaves = [];
  function collectLeaves(node, parentQty = 1) {
    const effectiveQty = node.quantity * parentQty;
    if (node.children.length === 0) {
      leaves.push({ ...node, effective_qty: effectiveQty });
    } else {
      node.children.forEach((c) => collectLeaves(c, effectiveQty));
    }
  }
  roots.forEach((r) => collectLeaves(r));

  // Match against inventory on-hand by description (exact match for now)
  const descriptions = [...new Set(leaves.map((l) => l.description))];
  const inventory = await db("inventory_items")
    .whereIn("description", descriptions)
    .select("description", "qty_on_hand", "qty_reserved");

  const invMap = {};
  inventory.forEach((i) => {
    invMap[i.description] = (invMap[i.description] || 0) + (i.qty_on_hand - i.qty_reserved);
  });

  const result = leaves.map((item) => {
    const onHand = invMap[item.description] || 0;
    const shortage = Math.max(0, item.effective_qty - onHand);
    return {
      bom_item_id: item.id,
      description: item.description,
      pn: item.pn,
      material: item.material,
      unit: item.unit,
      required_qty: item.effective_qty,
      on_hand_qty: onHand,
      shortage_qty: shortage,
      status: shortage > 0 ? "short" : "ok",
    };
  });

  return result;
}

/**
 * Auto-replenishment: runs MRP for a project and raises a Material Request
 * for all items in shortage. Returns null if nothing is short.
 */
async function replenishShortages(projectId, triggeredBy = null) {
  const mrpResult = await calculateMRP(projectId);
  const shortItems = mrpResult.filter((i) => i.shortage_qty > 0);

  if (shortItems.length === 0) return null;

  const [{ count }] = await db("material_requests").count("id as count");
  const mrNo = `MR-${String(Number(count) + 1).padStart(4, "0")}`;

  const [mr] = await db("material_requests")
    .insert({
      project_id: projectId,
      requested_by: null,
      mr_no: mrNo,
      status: "submitted",
      notes: `Auto-raised by MRP replenishment${triggeredBy ? ` — triggered by user ${triggeredBy}` : ""}`,
    })
    .returning("*");

  const lineRows = shortItems.map((item) => ({
    mr_id: mr.id,
    bom_item_id: item.bom_item_id,
    description: item.description,
    qty_requested: item.shortage_qty,
    qty_issued: 0,
    unit: item.unit || null,
  }));

  const insertedLines = await db("material_request_lines").insert(lineRows).returning("*");

  return { mr: { ...mr, lines: insertedLines }, shortItems };
}

module.exports = { calculateMRP, replenishShortages };
