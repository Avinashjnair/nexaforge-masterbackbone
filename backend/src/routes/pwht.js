const express = require('express');
const db = require('../db/knex');
const router = express.Router({ mergeParams: true });

// GET /projects/:id/pwht
router.get('/', async (req, res, next) => {
  try {
    const rows = await db('pwht_records as p')
      .leftJoin('weld_joints as j', 'j.id', 'p.joint_id')
      .where('p.project_id', req.params.id)
      .orderBy('p.created_at', 'desc')
      .select('p.*', 'j.joint_no');
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /projects/:id/pwht
router.post('/', async (req, res, next) => {
  try {
    const { joint_id, pwht_no, furnace_id, heat_rate_per_hr, hold_temp_c,
            hold_duration_min, cool_rate_per_hr, start_time, end_time,
            witnessed_by, chart_data, result, notes } = req.body;
    if (!pwht_no || !hold_temp_c || !hold_duration_min) {
      return res.status(400).json({ error: 'pwht_no, hold_temp_c and hold_duration_min are required' });
    }
    const [row] = await db('pwht_records').insert({
      project_id: req.params.id,
      joint_id: joint_id || null,
      pwht_no, furnace_id, heat_rate_per_hr, hold_temp_c, hold_duration_min,
      cool_rate_per_hr, start_time, end_time, witnessed_by,
      chart_data: chart_data ? JSON.stringify(chart_data) : null,
      result: result || 'pending',
      notes,
      logged_by: req.user?.sub || null,
    }).returning('*');
    res.status(201).json(row);
  } catch (err) { next(err); }
});

// PATCH /projects/:id/pwht/:pwhtId
router.patch('/:pwhtId', async (req, res, next) => {
  try {
    const allowed = ['result', 'end_time', 'witnessed_by', 'notes', 'chart_data'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.chart_data) updates.chart_data = JSON.stringify(updates.chart_data);
    updates.updated_at = db.fn.now();
    const [row] = await db('pwht_records').where('id', req.params.pwhtId)
      .where('project_id', req.params.id).update(updates).returning('*');
    if (!row) return res.status(404).json({ error: 'PWHT record not found' });
    res.json(row);
  } catch (err) { next(err); }
});

module.exports = router;
