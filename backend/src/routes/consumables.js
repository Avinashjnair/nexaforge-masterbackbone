const express = require('express');
const db = require('../db/knex');
const router = express.Router();

// GET /consumables/batches?projectId=
router.get('/batches', async (req, res, next) => {
  try {
    let q = db('weld_consumable_batches').orderBy('received_date', 'desc');
    if (req.query.projectId) q = q.where('project_id', req.query.projectId);
    const rows = await q;
    // Attach usage count per batch
    const ids = rows.map(r => r.id);
    const usage = ids.length
      ? await db('consumable_usage').whereIn('batch_id', ids)
          .groupBy('batch_id')
          .select('batch_id', db.raw('COUNT(*) as joint_count'), db.raw('SUM(qty_used) as qty_used'))
      : [];
    const usageMap = Object.fromEntries(usage.map(u => [u.batch_id, u]));
    res.json(rows.map(r => ({
      ...r,
      joint_count: Number(usageMap[r.id]?.joint_count || 0),
      qty_used: Number(usageMap[r.id]?.qty_used || 0),
    })));
  } catch (err) { next(err); }
});

// POST /consumables/batches
router.post('/batches', async (req, res, next) => {
  try {
    const { project_id, batch_no, material_spec, brand, heat_no,
            qty_received, qty_unit, received_date, mtc_available, storage_location } = req.body;
    if (!batch_no || !material_spec) {
      return res.status(400).json({ error: 'batch_no and material_spec are required' });
    }
    const [row] = await db('weld_consumable_batches').insert({
      project_id: project_id || null, batch_no, material_spec, brand, heat_no,
      qty_received, qty_unit: qty_unit || 'KG', received_date, mtc_available: !!mtc_available,
      storage_location, received_by: req.user?.sub || null,
    }).returning('*');
    res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Batch number already exists' });
    next(err);
  }
});

// GET /consumables/batches/:id/usage — joints this batch was used on
router.get('/batches/:id/usage', async (req, res, next) => {
  try {
    const rows = await db('consumable_usage as cu')
      .leftJoin('weld_joints as j', 'j.id', 'cu.joint_id')
      .leftJoin('employees as e', 'e.id', 'cu.welder_id')
      .where('cu.batch_id', req.params.id)
      .select('cu.*', 'j.joint_no', db.raw("COALESCE(e.first_name||' '||e.last_name, 'Unknown') as welder_name"));
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /consumables/usage — log batch→joint usage
router.post('/usage', async (req, res, next) => {
  try {
    const { batch_id, joint_id, project_id, welder_id, qty_used, qty_unit, usage_date } = req.body;
    if (!batch_id) return res.status(400).json({ error: 'batch_id is required' });
    const [row] = await db('consumable_usage').insert({
      batch_id, joint_id: joint_id || null, project_id: project_id || null,
      welder_id: welder_id || null, qty_used, qty_unit: qty_unit || 'KG',
      usage_date: usage_date || new Date().toISOString().slice(0, 10),
      logged_by: req.user?.sub || null,
    }).returning('*');
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// GET /consumables/joints/:jointId — all batches used on a specific joint
router.get('/joints/:jointId', async (req, res, next) => {
  try {
    const rows = await db('consumable_usage as cu')
      .join('weld_consumable_batches as b', 'b.id', 'cu.batch_id')
      .where('cu.joint_id', req.params.jointId)
      .select('cu.*', 'b.batch_no', 'b.material_spec', 'b.brand', 'b.heat_no', 'b.mtc_available');
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
