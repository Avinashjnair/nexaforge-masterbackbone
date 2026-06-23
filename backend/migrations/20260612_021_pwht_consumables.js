/**
 * Phase 3 — PWHT records + weld consumable traceability tables
 */

exports.up = async function (knex) {

  // ── PWHT records ─────────────────────────────────────────────
  await knex.schema.createTable('pwht_records', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('joint_id').references('id').inTable('weld_joints').onDelete('SET NULL');
    t.string('pwht_no', 50).notNullable();
    t.string('furnace_id', 100);
    t.decimal('heat_rate_per_hr', 8, 2);         // °C/hr
    t.decimal('hold_temp_c', 8, 2).notNullable(); // peak hold temperature
    t.integer('hold_duration_min').notNullable();  // hold time in minutes
    t.decimal('cool_rate_per_hr', 8, 2);          // °C/hr
    t.timestamp('start_time');
    t.timestamp('end_time');
    t.string('witnessed_by', 200);
    t.text('chart_data');  // JSON array of {time_min, temp_c} readings
    t.enum('result', ['pass', 'fail', 'pending']).defaultTo('pending');
    t.text('notes');
    t.uuid('logged_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index(['project_id']);
    t.index(['joint_id']);
  });

  // ── Consumable batches ────────────────────────────────────────
  await knex.schema.createTable('weld_consumable_batches', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
    t.string('batch_no', 100).notNullable().unique();
    t.string('material_spec', 200).notNullable();  // e.g. ER316L, E7018
    t.string('brand', 100);
    t.string('heat_no', 100);
    t.decimal('qty_received', 10, 2);
    t.string('qty_unit', 20).defaultTo('KG');
    t.date('received_date');
    t.boolean('mtc_available').defaultTo(false);
    t.string('storage_location', 100);
    t.uuid('received_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index(['project_id']);
    t.index(['batch_no']);
  });

  // ── Consumable usage — links batch to joint ───────────────────
  await knex.schema.createTable('consumable_usage', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('batch_id').notNullable().references('id').inTable('weld_consumable_batches').onDelete('CASCADE');
    t.uuid('joint_id').references('id').inTable('weld_joints').onDelete('SET NULL');
    t.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
    t.uuid('welder_id').references('id').inTable('employees').onDelete('SET NULL');
    t.decimal('qty_used', 10, 2);
    t.string('qty_unit', 20).defaultTo('KG');
    t.date('usage_date');
    t.uuid('logged_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index(['batch_id']);
    t.index(['joint_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('consumable_usage');
  await knex.schema.dropTableIfExists('weld_consumable_batches');
  await knex.schema.dropTableIfExists('pwht_records');
};
