/**
 * S-14 — HR, Finance & Store
 * ENH-03: auto_invoice flag on milestones
 * ENH-04: remnant_stock table
 * ENH-05: vendor_quality_scores table
 * NEW-05: leave_requests table
 * NEW-06: attendance table
 * NEW-07: expense_claims table
 */

exports.up = async function (knex) {
  // ENH-03 — auto_invoice flag on milestones so Finance can opt individual
  //           milestones out of auto-drafting
  await knex.schema.alterTable("milestones", (t) => {
    t.boolean("auto_invoice").defaultTo(true);
  });

  // ENH-04 — remnant / off-cut tracking
  await knex.schema.createTable("remnant_stock", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("parent_item_id").references("id").inTable("inventory_items").onDelete("SET NULL");
    t.string("heat_no", 100);
    t.string("material", 200).notNullable();
    t.string("dimensions", 200); // e.g. "2400 × 150 × 10 mm"
    t.decimal("weight_kg", 10, 3);
    t.uuid("source_project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.uuid("reserved_project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.string("location", 200);
    t.enum("status", ["available", "reserved", "scrapped"]).defaultTo("available");
    t.uuid("created_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["status", "material"]);
  });

  // ENH-05 — vendor quality scores (computed monthly from GRN data)
  await knex.schema.createTable("vendor_quality_scores", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("vendor_name", 200).notNullable();
    t.date("period_month").notNullable(); // first day of the scored month
    t.integer("po_count").defaultTo(0);
    t.integer("grn_count").defaultTo(0);
    t.integer("accepted").defaultTo(0);
    t.integer("rejected").defaultTo(0);
    t.decimal("score_pct", 5, 2);
    t.timestamps(true, true);
    t.unique(["vendor_name", "period_month"]);
    t.index(["vendor_name", "period_month"]);
  });

  // NEW-05 — leave requests
  await knex.schema.createTable("leave_requests", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.enum("type", ["annual", "sick", "unpaid", "emergency"]).notNullable();
    t.date("start_date").notNullable();
    t.date("end_date").notNullable();
    t.integer("days").notNullable();
    t.text("reason");
    t.enum("status", ["pending", "approved", "rejected"]).defaultTo("pending");
    t.uuid("approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("decided_at");
    t.text("decision_notes");
    t.timestamps(true, true);
    t.index(["employee_id", "status"]);
    t.index(["start_date", "end_date"]);
  });

  // NEW-06 — time & attendance
  await knex.schema.createTable("attendance", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.date("work_date").notNullable();
    t.timestamp("clock_in");
    t.timestamp("clock_out");
    t.decimal("total_hours", 6, 2);
    t.enum("source", ["manual", "biometric"]).defaultTo("manual");
    t.text("notes");
    t.uuid("recorded_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.unique(["employee_id", "work_date"]);
    t.index(["employee_id", "work_date"]);
  });

  // NEW-07 — expense claims
  await knex.schema.createTable("expense_claims", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.date("expense_date").notNullable();
    t.string("category", 100).notNullable(); // Travel, Accommodation, Tools, Meals, Other
    t.decimal("amount", 12, 2).notNullable();
    t.string("currency", 3).defaultTo("USD");
    t.text("description").notNullable();
    t.uuid("receipt_file_id").references("id").inTable("files").onDelete("SET NULL");
    t.enum("status", ["draft", "submitted", "approved", "rejected", "paid"]).defaultTo("draft");
    t.uuid("hr_approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("hr_decided_at");
    t.text("hr_notes");
    t.uuid("finance_paid_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("paid_at");
    t.timestamps(true, true);
    t.index(["employee_id", "status"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("expense_claims");
  await knex.schema.dropTableIfExists("attendance");
  await knex.schema.dropTableIfExists("leave_requests");
  await knex.schema.dropTableIfExists("vendor_quality_scores");
  await knex.schema.dropTableIfExists("remnant_stock");
  await knex.schema.alterTable("milestones", (t) => {
    t.dropColumn("auto_invoice");
  });
};
