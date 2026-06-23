/**
 * S-12 — Production operations
 * NEW-01: labour_hours table
 * NEW-02: routing_steps scheduling columns
 * NEW-03: deviation_requests table
 * NEW-09: machine_downtime_log table
 */

exports.up = async function (knex) {
  // NEW-02 — scheduling columns on routing_steps
  await knex.schema.alterTable("routing_steps", (t) => {
    t.uuid("assigned_employee_id").references("id").inTable("employees").onDelete("SET NULL");
    t.date("scheduled_date");
  });

  // NEW-01 — labour hours logging (shop floor timesheets)
  await knex.schema.createTable("labour_hours", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("routing_step_id").references("id").inTable("routing_steps").onDelete("SET NULL");
    t.date("work_date").notNullable();
    t.decimal("hours_direct", 6, 2).notNullable().defaultTo(0);
    t.decimal("hours_indirect", 6, 2).notNullable().defaultTo(0);
    t.enum("activity_type", ["fabrication", "welding", "assembly", "inspection", "rework", "other"]).defaultTo("other");
    t.text("notes");
    t.uuid("logged_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["employee_id", "work_date"]);
    t.index(["project_id", "work_date"]);
  });

  // NEW-03 — deviation request workflow (Production → QC → GM)
  await knex.schema.createTable("deviation_requests", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("raised_by").references("id").inTable("users").onDelete("SET NULL");
    t.string("deviation_no", 50).notNullable().unique();
    t.text("description").notNullable();
    t.string("drawing_ref", 200);
    t.text("current_spec");
    t.text("proposed_deviation").notNullable();
    t.text("justification").notNullable();
    t.enum("status", ["pending", "qc_review", "gm_approval", "approved", "rejected"]).defaultTo("pending");
    t.uuid("qc_reviewed_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("qc_reviewed_at");
    t.text("qc_comments");
    t.uuid("gm_approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("gm_decided_at");
    t.text("gm_comments");
    t.timestamps(true, true);
    t.index(["project_id", "status"]);
  });

  // NEW-09 — machine downtime logging (feeds OEE in Analytics)
  await knex.schema.createTable("machine_downtime_log", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("machine_id", 100).notNullable();
    t.timestamp("start_time").notNullable();
    t.timestamp("end_time");
    t.enum("type", ["planned", "unplanned"]).notNullable();
    t.string("reason", 300).notNullable();
    t.decimal("duration_hours", 8, 2);
    t.uuid("raised_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["machine_id", "start_time"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("machine_downtime_log");
  await knex.schema.dropTableIfExists("deviation_requests");
  await knex.schema.dropTableIfExists("labour_hours");
  await knex.schema.alterTable("routing_steps", (t) => {
    t.dropColumn("assigned_employee_id");
    t.dropColumn("scheduled_date");
  });
};
