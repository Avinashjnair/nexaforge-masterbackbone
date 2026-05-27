/**
 * S-13 — QC enhancements
 * ENH-01: Add 'S' (Surveillance) hold_type to itp_steps
 * ENH-02: ncr_rca table — structured RCA before disposition
 * ENH-06: spc_readings + spc_control_charts
 * ENH-07: calibration_items + calibration_records
 * ENH-08: jig_fixtures
 */

exports.up = async function (knex) {
  // ENH-01 — Surveillance hold-point: Knex creates a CHECK constraint for enums.
  // Drop the existing check and recreate with S included.
  await knex.raw(`
    ALTER TABLE itp_steps
      DROP CONSTRAINT IF EXISTS itp_steps_hold_type_check,
      ADD  CONSTRAINT itp_steps_hold_type_check
           CHECK (hold_type IN ('H', 'W', 'R', 'S'))
  `);

  // ENH-02 — NCR Root Cause Analysis
  await knex.schema.createTable("ncr_rca", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("ncr_id").notNullable().unique().references("id").inTable("ncrs").onDelete("CASCADE");
    t.enum("method", ["5why", "fishbone", "other"]).defaultTo("5why");
    t.text("why_1");
    t.text("why_2");
    t.text("why_3");
    t.text("why_4");
    t.text("why_5");
    t.text("root_cause").notNullable();
    t.text("corrective_action").notNullable();
    t.text("preventive_action");
    t.uuid("submitted_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  // ENH-06 — SPC readings (individual measurement data)
  await knex.schema.createTable("spc_readings", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.string("characteristic", 200).notNullable(); // e.g. "Nozzle OD", "Shell thickness"
    t.decimal("nominal", 12, 4).notNullable();
    t.decimal("usl", 12, 4).notNullable(); // Upper spec limit
    t.decimal("lsl", 12, 4).notNullable(); // Lower spec limit
    t.jsonb("readings").notNullable();      // array of measured values
    t.string("unit", 30);
    t.uuid("recorded_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["project_id", "characteristic"]);
  });

  // ENH-06 — SPC control charts (computed from readings)
  await knex.schema.createTable("spc_control_charts", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("spc_reading_id").notNullable().unique()
      .references("id").inTable("spc_readings").onDelete("CASCADE");
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.string("characteristic", 200).notNullable();
    t.decimal("xbar",  12, 6); // Process mean
    t.decimal("r_bar", 12, 6); // Mean range
    t.decimal("sigma", 12, 6); // Process std dev
    t.decimal("ucl",   12, 6); // Upper control limit (xbar + 3σ)
    t.decimal("lcl",   12, 6); // Lower control limit (xbar - 3σ)
    t.decimal("cpk",   8, 4);  // Process capability index
    t.decimal("cp",    8, 4);  // Process capability ratio
    t.jsonb("out_of_control_points"); // indices of OOC readings
    t.timestamps(true, true);
  });

  // ENH-07 — Calibration items register
  await knex.schema.createTable("calibration_items", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("item_ref", 100).notNullable().unique();
    t.string("description", 300).notNullable();
    t.string("location", 200);
    t.string("calibration_body", 200);
    t.integer("frequency_days").notNullable().defaultTo(365);
    t.date("last_calibrated");
    t.date("next_due");
    t.enum("status", ["active", "overdue", "due_soon", "retired"]).defaultTo("active");
    t.timestamps(true, true);
    t.index(["next_due", "status"]);
  });

  // ENH-07 — Calibration records (history)
  await knex.schema.createTable("calibration_records", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("item_id").notNullable().references("id").inTable("calibration_items").onDelete("CASCADE");
    t.date("calibrated_date").notNullable();
    t.string("calibrated_by", 200);
    t.enum("result", ["pass", "fail", "conditional"]).notNullable();
    t.string("cert_ref", 100);
    t.uuid("file_id").references("id").inTable("uploaded_files").onDelete("SET NULL");
    t.text("notes");
    t.uuid("recorded_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  // ENH-08 — Jig & fixture register
  await knex.schema.createTable("jig_fixtures", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("ref", 100).notNullable().unique();
    t.string("description", 300).notNullable();
    t.string("location", 200);
    t.enum("condition", ["serviceable", "maintenance", "condemned"]).defaultTo("serviceable");
    t.uuid("project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.date("last_inspection_date");
    t.text("notes");
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("jig_fixtures");
  await knex.schema.dropTableIfExists("calibration_records");
  await knex.schema.dropTableIfExists("calibration_items");
  await knex.schema.dropTableIfExists("spc_control_charts");
  await knex.schema.dropTableIfExists("spc_readings");
  await knex.schema.dropTableIfExists("ncr_rca");
  await knex.raw(`
    ALTER TABLE itp_steps
      DROP CONSTRAINT IF EXISTS itp_steps_hold_type_check,
      ADD  CONSTRAINT itp_steps_hold_type_check
           CHECK (hold_type IN ('H', 'W', 'R'))
  `);
};
