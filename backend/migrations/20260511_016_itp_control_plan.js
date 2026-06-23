/**
 * S-16 — ITP & Control Plan enhancement
 *
 * 1. itp_steps — add parameters, responsible, internal/customer/tpi inspection codes, remarks
 * 2. itp_sign_offs — add party (internal | customer | tpi)
 * 3. control_plan_templates — standard library keyed by project_type
 * 4. project_control_plans — project-specific CP rows (optionally cloned from template)
 */
exports.up = async function (knex) {
  // ── 1. Alter itp_steps ─────────────────────────────────────────
  await knex.schema.alterTable("itp_steps", (t) => {
    t.text("parameters");
    t.string("responsible", 100);
    t.string("internal_code", 1).notNullable().defaultTo("P");
    t.string("customer_code", 1).nullable();
    t.string("tpi_code", 1).nullable();
    t.text("remarks");
  });
  await knex.raw(`
    ALTER TABLE itp_steps
      ADD CONSTRAINT itp_steps_internal_code_check CHECK (internal_code IN ('P','R','W','H')),
      ADD CONSTRAINT itp_steps_customer_code_check CHECK (customer_code IS NULL OR customer_code IN ('P','R','W','H')),
      ADD CONSTRAINT itp_steps_tpi_code_check      CHECK (tpi_code      IS NULL OR tpi_code      IN ('P','R','W','H'))
  `);

  // ── 2. Alter itp_sign_offs ─────────────────────────────────────
  await knex.schema.alterTable("itp_sign_offs", (t) => {
    t.string("party", 10).notNullable().defaultTo("internal");
  });
  await knex.raw(`
    ALTER TABLE itp_sign_offs
      ADD CONSTRAINT itp_sign_offs_party_check CHECK (party IN ('internal','customer','tpi'))
  `);

  // ── 3. control_plan_templates ──────────────────────────────────
  await knex.schema.createTable("control_plan_templates", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("project_type", 100).notNullable();
    t.integer("stage_no").notNullable();
    t.string("stage_name", 100).notNullable();
    t.string("activity", 300).notNullable();
    t.string("reference_doc", 200);
    t.text("parameters");
    t.string("responsible", 100);
    t.string("internal_code", 1).notNullable().defaultTo("P");
    t.string("customer_code", 1).nullable();
    t.string("tpi_code", 1).nullable();
    t.text("remarks");
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE control_plan_templates
      ADD CONSTRAINT cpt_internal_code_check CHECK (internal_code IN ('P','R','W','H')),
      ADD CONSTRAINT cpt_customer_code_check CHECK (customer_code IS NULL OR customer_code IN ('P','R','W','H')),
      ADD CONSTRAINT cpt_tpi_code_check      CHECK (tpi_code      IS NULL OR tpi_code      IN ('P','R','W','H'))
  `);
  await knex.raw("CREATE INDEX ON control_plan_templates (project_type)");

  // ── 4. project_control_plans ───────────────────────────────────
  await knex.schema.createTable("project_control_plans", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("template_item_id").nullable()
      .references("id").inTable("control_plan_templates").onDelete("SET NULL");
    t.integer("stage_no").notNullable();
    t.string("stage_name", 100).notNullable();
    t.string("activity", 300).notNullable();
    t.string("reference_doc", 200);
    t.text("parameters");
    t.string("responsible", 100);
    t.string("internal_code", 1).notNullable().defaultTo("P");
    t.string("customer_code", 1).nullable();
    t.string("tpi_code", 1).nullable();
    t.enum("status", ["pending", "in_progress", "passed", "failed", "na"]).defaultTo("pending");
    t.text("remarks");
    t.boolean("is_locked").defaultTo(false);
    t.timestamps(true, true);
  });
  await knex.raw(`
    ALTER TABLE project_control_plans
      ADD CONSTRAINT pcp_internal_code_check CHECK (internal_code IN ('P','R','W','H')),
      ADD CONSTRAINT pcp_customer_code_check CHECK (customer_code IS NULL OR customer_code IN ('P','R','W','H')),
      ADD CONSTRAINT pcp_tpi_code_check      CHECK (tpi_code      IS NULL OR tpi_code      IN ('P','R','W','H'))
  `);
  await knex.raw("CREATE INDEX ON project_control_plans (project_id)");
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("project_control_plans");
  await knex.schema.dropTableIfExists("control_plan_templates");

  await knex.schema.alterTable("itp_sign_offs", (t) => { t.dropColumn("party"); });

  await knex.schema.alterTable("itp_steps", (t) => {
    t.dropColumn("parameters");
    t.dropColumn("responsible");
    t.dropColumn("internal_code");
    t.dropColumn("customer_code");
    t.dropColumn("tpi_code");
    t.dropColumn("remarks");
  });
};
