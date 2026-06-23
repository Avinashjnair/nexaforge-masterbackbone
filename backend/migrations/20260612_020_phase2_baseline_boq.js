/**
 * Phase 2 — Gantt baseline snapshots
 * Stores a frozen copy of routing_steps at the moment "Set Baseline" is clicked.
 */

exports.up = async function (knex) {
  await knex.schema.createTable('schedule_baselines', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.string('label', 100).notNullable().defaultTo('Baseline');
    t.jsonb('steps_snapshot').notNullable(); // array of {step_order, name, start_date, end_date, planned_hours}
    t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    t.timestamps(true, true);
    t.index(['project_id', 'created_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('schedule_baselines');
};
