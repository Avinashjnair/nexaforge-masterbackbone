/**
 * S-15 — New workflows & modules
 * NEW-08: project_comments  — cross-dept commenting on projects
 * NEW-10: kaizen_ideas       — continuous improvement tracking
 * NEW-11: field_visit_requests — field operations module
 * NEW-12: customer_complaints  — complaint management linked to NCR + COPQ
 */

exports.up = async function (knex) {
  // NEW-08 — cross-department project comments (the ONE isolation exception per ADR-005)
  await knex.schema.createTable("project_comments", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("author_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("dept", 100).notNullable();
    t.text("body").notNullable();
    t.uuid("parent_id").references("id").inTable("project_comments").onDelete("CASCADE");
    t.jsonb("mentions").defaultTo("[]"); // array of user_id strings
    t.boolean("is_edited").defaultTo(false);
    t.timestamps(true, true);
    t.index(["project_id", "created_at"]);
    t.index(["parent_id"]);
  });

  // NEW-10 — kaizen idea submission + tracking board
  await knex.schema.createTable("kaizen_ideas", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("submitted_by").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("dept", 100).notNullable();
    t.string("title", 300).notNullable();
    t.text("description").notNullable();
    t.enum("category", ["safety", "quality", "efficiency", "cost", "delivery"]).notNullable();
    t.enum("status", ["submitted", "review", "approved", "implementing", "complete", "rejected"]).defaultTo("submitted");
    t.text("impact_est"); // free-text estimated impact
    t.uuid("reviewed_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("reviewed_at");
    t.text("review_notes");
    t.timestamps(true, true);
    t.index(["status", "dept"]);
  });

  // NEW-11 — field operations / site visits
  await knex.schema.createTable("field_visit_requests", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.uuid("requested_by").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("visit_no", 50).notNullable().unique();
    t.string("site_location", 300).notNullable();
    t.text("purpose").notNullable();
    t.date("requested_date").notNullable();
    t.date("scheduled_date");
    t.enum("status", ["pending", "approved", "scheduled", "completed", "cancelled"]).defaultTo("pending");
    t.jsonb("assigned_team").defaultTo("[]"); // array of employee_id strings
    t.uuid("report_file_id").references("id").inTable("files").onDelete("SET NULL");
    t.text("report_notes");
    t.uuid("approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["project_id", "status"]);
  });

  // NEW-12 — customer complaints (linked to NCR + COPQ)
  await knex.schema.createTable("customer_complaints", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("client_id").references("id").inTable("clients").onDelete("SET NULL");
    t.uuid("project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.string("complaint_no", 50).notNullable().unique();
    t.date("received_date").notNullable();
    t.text("description").notNullable();
    t.enum("severity", ["critical", "major", "minor"]).notNullable();
    t.enum("status", ["open", "investigating", "resolved", "closed"]).defaultTo("open");
    t.uuid("linked_ncr_id").references("id").inTable("ncrs").onDelete("SET NULL");
    t.text("resolution_notes");
    t.date("resolved_date");
    t.uuid("logged_by").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("assigned_to").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["client_id", "status"]);
    t.index(["project_id"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("customer_complaints");
  await knex.schema.dropTableIfExists("field_visit_requests");
  await knex.schema.dropTableIfExists("kaizen_ideas");
  await knex.schema.dropTableIfExists("project_comments");
};
