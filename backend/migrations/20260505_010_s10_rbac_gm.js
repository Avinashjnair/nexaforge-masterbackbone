/**
 * S-10 — RBAC isolation + GM workflows
 * ARCH-01: no schema changes (users.department already exists)
 * ARCH-02: gm_interventions table
 * NEW-04:  priority field on projects
 */

exports.up = async function (knex) {
  // NEW-04 — Rush order priority on projects
  await knex.schema.alterTable("projects", (t) => {
    t.enum("priority", ["normal", "urgent", "rush"]).defaultTo("normal").after("scope_notes");
  });

  // ARCH-02 — GM intervention audit log
  await knex.schema.createTable("gm_interventions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").references("id").inTable("projects").onDelete("CASCADE");
    t.enum("action_type", ["priority_override", "resource_reallocation", "hold_release", "rush_order"])
      .notNullable();
    t.text("reason").notNullable();
    t.string("target_dept", 100);
    t.uuid("created_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("gm_interventions");
  await knex.schema.alterTable("projects", (t) => {
    t.dropColumn("priority");
  });
};
