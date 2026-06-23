/**
 * NexaForge ERP — Initial Schema
 * All 45 tables in dependency order (no forward references).
 * TimescaleDB hypertable for iiot_readings created at the end.
 */

exports.up = async function (knex) {
  // ── Enable extensions ─────────────────────────────────────────
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE');

  // ── 1. clients ────────────────────────────────────────────────
  await knex.schema.createTable("clients", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("name", 200).notNullable();
    t.string("short_code", 20).unique();
    t.string("country", 100);
    t.string("city", 100);
    t.string("contact_name", 150);
    t.string("contact_email", 200);
    t.string("contact_phone", 50);
    t.text("address");
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  // ── 2. users ──────────────────────────────────────────────────
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("email", 200).notNullable().unique();
    t.string("password_hash", 255).notNullable();
    t.string("full_name", 200).notNullable();
    t.enum("role", ["gm", "manager", "senior", "user"]).defaultTo("user");
    t.string("department", 100);
    t.boolean("is_active").defaultTo(true);
    t.timestamp("last_login_at");
    t.timestamps(true, true);
  });

  // ── 3. employees ──────────────────────────────────────────────
  await knex.schema.createTable("employees", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").references("id").inTable("users").onDelete("SET NULL");
    t.string("employee_no", 50).notNullable().unique();
    t.string("full_name", 200).notNullable();
    t.string("position", 150);
    t.string("department", 100);
    t.string("nationality", 100);
    t.date("dob");
    t.date("hire_date");
    t.date("contract_end_date");
    t.enum("status", ["active", "on_leave", "terminated"]).defaultTo("active");
    t.string("phone", 50);
    t.string("email", 200);
    t.timestamps(true, true);
  });

  // ── 4. projects ───────────────────────────────────────────────
  await knex.schema.createTable("projects", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("project_no", 50).notNullable().unique();
    t.string("name", 300).notNullable();
    t.uuid("client_id").references("id").inTable("clients").onDelete("SET NULL");
    t.enum("status", ["planning", "active", "qc_hold", "completed", "cancelled"]).defaultTo("planning");
    t.integer("phase").defaultTo(1);
    t.decimal("progress_pct", 5, 2).defaultTo(0);
    t.decimal("contract_value", 14, 2);
    t.string("currency", 3).defaultTo("USD");
    t.date("due_date");
    t.string("product_type", 100);  // Tank, Pressure Vessel, Heat Exchanger
    t.string("material_grade", 50); // 304, 316L, CS, etc.
    t.uuid("project_manager_id").references("id").inTable("employees").onDelete("SET NULL");
    t.text("scope_notes");
    t.timestamps(true, true);
  });

  // ── 5. milestones ─────────────────────────────────────────────
  await knex.schema.createTable("milestones", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.string("name", 200).notNullable();
    t.decimal("billing_pct", 5, 2);
    t.decimal("billing_amount", 14, 2);
    t.enum("status", ["pending", "triggered", "invoiced"]).defaultTo("pending");
    t.date("target_date");
    t.date("achieved_date");
    t.timestamps(true, true);
  });

  // ── 6. bom_items ─────────────────────────────────────────────
  await knex.schema.createTable("bom_items", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("parent_id").references("id").inTable("bom_items").onDelete("CASCADE");
    t.string("pn", 100);
    t.text("description").notNullable();
    t.decimal("quantity", 10, 3).notNullable();
    t.string("unit", 20);
    t.string("material", 100);
    t.string("heat_no", 100);
    t.enum("item_type", ["assembly", "part", "material"]).defaultTo("part");
    t.enum("stock_status", ["unknown", "in_stock", "ordered", "short"]).defaultTo("unknown");
    t.timestamps(true, true);
  });

  // ── 7. work_centres ──────────────────────────────────────────
  await knex.schema.createTable("work_centres", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("code", 20).notNullable().unique();
    t.string("name", 150).notNullable();
    t.string("department", 100);
    t.boolean("is_active").defaultTo(true);
    t.timestamps(true, true);
  });

  // ── 8. routing_steps ─────────────────────────────────────────
  await knex.schema.createTable("routing_steps", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("work_centre_id").references("id").inTable("work_centres").onDelete("SET NULL");
    t.integer("step_order").notNullable();
    t.string("name", 200).notNullable();
    t.enum("status", ["pending", "in_progress", "completed", "on_hold"]).defaultTo("pending");
    t.decimal("planned_hours", 8, 2);
    t.decimal("actual_hours", 8, 2);
    t.date("start_date");
    t.date("end_date");
    t.timestamps(true, true);
  });

  // ── 9. material_requests ─────────────────────────────────────
  await knex.schema.createTable("material_requests", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("requested_by").references("id").inTable("employees").onDelete("SET NULL");
    t.string("mr_no", 50).notNullable().unique();
    t.enum("status", ["draft", "submitted", "approved", "issued", "cancelled"]).defaultTo("draft");
    t.text("notes");
    t.timestamps(true, true);
  });

  // ── 10. material_request_lines ────────────────────────────────
  await knex.schema.createTable("material_request_lines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("mr_id").notNullable().references("id").inTable("material_requests").onDelete("CASCADE");
    t.uuid("bom_item_id").references("id").inTable("bom_items").onDelete("SET NULL");
    t.text("description").notNullable();
    t.decimal("qty_requested", 10, 3).notNullable();
    t.decimal("qty_issued", 10, 3).defaultTo(0);
    t.string("unit", 20);
    t.timestamps(true, true);
  });

  // ── 11. itp_steps ────────────────────────────────────────────
  await knex.schema.createTable("itp_steps", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.integer("step_no").notNullable();
    t.string("activity", 300).notNullable();
    t.enum("hold_type", ["H", "W", "R"]).notNullable(); // Hold / Witness / Review
    t.enum("status", ["pending", "in_progress", "approved", "rejected"]).defaultTo("pending");
    t.boolean("is_hold_active").defaultTo(false);
    t.text("reference_doc");
    t.timestamps(true, true);
  });

  // ── 12. itp_sign_offs ─────────────────────────────────────────
  await knex.schema.createTable("itp_sign_offs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("itp_step_id").notNullable().references("id").inTable("itp_steps").onDelete("CASCADE");
    t.uuid("signed_by").notNullable().references("id").inTable("users").onDelete("RESTRICT");
    t.enum("role_at_sign", ["gm", "manager", "senior", "user"]).notNullable();
    t.enum("result", ["approved", "rejected", "conditional"]).notNullable();
    t.text("comments");
    t.timestamp("signed_at").defaultTo(knex.fn.now());
  });

  // ── 13. ncrs ─────────────────────────────────────────────────
  await knex.schema.createTable("ncrs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.string("ncr_no", 50).notNullable().unique();
    t.string("title", 300).notNullable();
    t.text("description");
    t.enum("severity", ["critical", "major", "minor"]).defaultTo("minor");
    t.enum("status", ["open", "under_review", "rework", "accepted", "closed", "rejected"]).defaultTo("open");
    t.enum("disposition", ["rework", "repair", "use_as_is", "reject", "scrap"]);
    t.uuid("raised_by").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("assigned_to").references("id").inTable("users").onDelete("SET NULL");
    t.date("due_date");
    t.text("root_cause");
    t.text("corrective_action");
    t.timestamps(true, true);
  });

  // ── 14. ncr_comments ─────────────────────────────────────────
  await knex.schema.createTable("ncr_comments", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("ncr_id").notNullable().references("id").inTable("ncrs").onDelete("CASCADE");
    t.uuid("user_id").references("id").inTable("users").onDelete("SET NULL");
    t.text("comment").notNullable();
    t.enum("action_type", ["comment", "status_change", "assignment"]).defaultTo("comment");
    t.timestamps(true, true);
  });

  // ── 15. wps (Welding Procedure Specifications) ────────────────
  await knex.schema.createTable("wps", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("wps_no", 100).notNullable().unique();
    t.string("revision", 10).defaultTo("0");
    t.enum("status", ["draft", "active", "superseded", "withdrawn"]).defaultTo("draft");
    t.string("process", 100);   // SMAW, GTAW, FCAW, SAW
    t.string("base_metal", 100);
    t.string("filler_metal", 100);
    t.string("position", 50);
    t.string("pwht", 100);
    t.string("standard", 50);   // ASME IX, AWS D1.1
    t.date("approved_date");
    t.uuid("approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  // ── 16. pqr (Procedure Qualification Records) ─────────────────
  await knex.schema.createTable("pqr", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("wps_id").references("id").inTable("wps").onDelete("SET NULL");
    t.string("pqr_no", 100).notNullable().unique();
    t.date("test_date");
    t.enum("result", ["pass", "fail", "pending"]).defaultTo("pending");
    t.string("test_lab", 200);
    t.text("notes");
    t.timestamps(true, true);
  });

  // ── 17. wpq (Welder Performance Qualifications) ───────────────
  await knex.schema.createTable("wpq", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.uuid("wps_id").references("id").inTable("wps").onDelete("SET NULL");
    t.string("stamp_no", 50).notNullable().unique();
    t.string("process", 100);
    t.string("position", 50);
    t.string("material_group", 100);
    t.date("qualified_date").notNullable();
    t.date("expiry_date").notNullable();
    t.enum("status", ["active", "expiring_soon", "expired", "suspended"]).defaultTo("active");
    t.timestamps(true, true);
  });

  // ── 18. weld_joints ───────────────────────────────────────────
  await knex.schema.createTable("weld_joints", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("wps_id").references("id").inTable("wps").onDelete("SET NULL");
    t.uuid("welder_id").references("id").inTable("employees").onDelete("SET NULL");
    t.string("joint_no", 50).notNullable();
    t.string("drawing_ref", 100);
    t.string("joint_type", 50);
    t.string("material", 100);
    t.decimal("thickness_mm", 6, 2);
    t.decimal("diameter_mm", 6, 2);
    t.enum("status", ["pending", "in_progress", "welded", "nde_required", "accepted", "rejected"]).defaultTo("pending");
    t.date("weld_date");
    t.timestamps(true, true);
    t.unique(["project_id", "joint_no"]);
  });

  // ── 19. nde_records ───────────────────────────────────────────
  await knex.schema.createTable("nde_records", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("joint_id").notNullable().references("id").inTable("weld_joints").onDelete("CASCADE");
    t.enum("method", ["VT", "PT", "MT", "UT", "RT", "PAUT"]).notNullable();
    t.date("test_date");
    t.string("technician", 200);
    t.string("procedure_ref", 100);
    t.enum("result", ["accept", "reject", "pending"]).defaultTo("pending");
    t.text("findings");
    t.timestamps(true, true);
  });

  // ── 20. consumable_lots ───────────────────────────────────────
  await knex.schema.createTable("consumable_lots", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("lot_no", 100).notNullable().unique();
    t.string("heat_no", 100);
    t.string("type", 100);       // Electrode, Wire, Flux
    t.string("classification", 100); // E7018, ER308L, etc.
    t.string("manufacturer", 150);
    t.date("cert_date");
    t.date("expiry_date");
    t.timestamps(true, true);
  });

  // ── 21. opportunities ─────────────────────────────────────────
  await knex.schema.createTable("opportunities", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("client_id").references("id").inTable("clients").onDelete("SET NULL");
    t.string("title", 300).notNullable();
    t.string("rfq_no", 100);
    t.enum("stage", ["lead", "rfq", "proposal", "negotiation", "won", "lost"]).defaultTo("lead");
    t.decimal("estimated_value", 14, 2);
    t.string("currency", 3).defaultTo("USD");
    t.integer("probability_pct").defaultTo(0);
    t.date("expected_close_date");
    t.uuid("owner_id").references("id").inTable("users").onDelete("SET NULL");
    t.text("notes");
    t.timestamps(true, true);
  });

  // ── 22. quotes ────────────────────────────────────────────────
  await knex.schema.createTable("quotes", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("opportunity_id").notNullable().references("id").inTable("opportunities").onDelete("CASCADE");
    t.string("quote_no", 100).notNullable().unique();
    t.string("revision", 10).defaultTo("0");
    t.enum("status", ["draft", "submitted", "accepted", "rejected", "expired"]).defaultTo("draft");
    t.decimal("total_amount", 14, 2);
    t.decimal("discount_pct", 5, 2).defaultTo(0);
    t.date("valid_until");
    t.text("terms");
    t.timestamps(true, true);
  });

  // ── 23. quote_lines ───────────────────────────────────────────
  await knex.schema.createTable("quote_lines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("quote_id").notNullable().references("id").inTable("quotes").onDelete("CASCADE");
    t.integer("line_no").notNullable();
    t.text("description").notNullable();
    t.decimal("quantity", 10, 3).notNullable();
    t.string("unit", 20);
    t.decimal("unit_price", 14, 2).notNullable();
    t.decimal("total_price", 14, 2).notNullable();
    t.timestamps(true, true);
  });

  // ── 24. crm_activities ────────────────────────────────────────
  await knex.schema.createTable("crm_activities", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("opportunity_id").references("id").inTable("opportunities").onDelete("CASCADE");
    t.uuid("client_id").references("id").inTable("clients").onDelete("CASCADE");
    t.uuid("user_id").references("id").inTable("users").onDelete("SET NULL");
    t.enum("type", ["call", "email", "meeting", "site_visit", "follow_up"]).notNullable();
    t.string("subject", 300);
    t.text("notes");
    t.timestamp("activity_date").defaultTo(knex.fn.now());
    t.timestamps(true, true);
  });

  // ── 25. purchase_orders ───────────────────────────────────────
  await knex.schema.createTable("purchase_orders", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.string("po_no", 100).notNullable().unique();
    t.string("vendor_name", 200).notNullable();
    t.string("vendor_email", 200);
    t.enum("status", ["draft", "sent", "acknowledged", "partially_received", "received", "cancelled"]).defaultTo("draft");
    t.decimal("total_amount", 14, 2);
    t.string("currency", 3).defaultTo("USD");
    t.date("required_date");
    t.text("terms");
    t.uuid("created_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  // ── 26. po_lines ──────────────────────────────────────────────
  await knex.schema.createTable("po_lines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("po_id").notNullable().references("id").inTable("purchase_orders").onDelete("CASCADE");
    t.integer("line_no").notNullable();
    t.text("description").notNullable();
    t.decimal("quantity", 10, 3).notNullable();
    t.string("unit", 20);
    t.decimal("unit_price", 14, 2).notNullable();
    t.decimal("qty_received", 10, 3).defaultTo(0);
    t.timestamps(true, true);
  });

  // ── 27. grn (Goods Received Notes) ───────────────────────────
  await knex.schema.createTable("grn", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("po_id").references("id").inTable("purchase_orders").onDelete("SET NULL");
    t.string("grn_no", 100).notNullable().unique();
    t.date("received_date").notNullable();
    t.string("delivery_note_no", 100);
    t.enum("inspection_status", ["pending", "in_progress", "accepted", "rejected", "partially_accepted"]).defaultTo("pending");
    t.uuid("received_by").references("id").inTable("users").onDelete("SET NULL");
    t.text("remarks");
    t.timestamps(true, true);
  });

  // ── 28. grn_lines ─────────────────────────────────────────────
  await knex.schema.createTable("grn_lines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("grn_id").notNullable().references("id").inTable("grn").onDelete("CASCADE");
    t.uuid("po_line_id").references("id").inTable("po_lines").onDelete("SET NULL");
    t.text("description").notNullable();
    t.decimal("qty_received", 10, 3).notNullable();
    t.string("unit", 20);
    t.string("heat_no", 100);
    t.string("cert_no", 100);
    t.enum("condition", ["good", "damaged", "short", "rejected"]).defaultTo("good");
    t.timestamps(true, true);
  });

  // ── 29. inventory_items ───────────────────────────────────────
  await knex.schema.createTable("inventory_items", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("item_code", 100).notNullable().unique();
    t.text("description").notNullable();
    t.string("category", 100);
    t.string("sub_category", 100);
    t.string("material_grade", 50);
    t.string("heat_no", 100);
    t.string("cert_no", 100);
    t.string("unit", 20);
    t.decimal("qty_on_hand", 10, 3).defaultTo(0);
    t.decimal("qty_reserved", 10, 3).defaultTo(0);
    t.decimal("reorder_point", 10, 3).defaultTo(0);
    t.string("location", 100);
    t.enum("status", ["available", "reserved", "quarantine", "disposed"]).defaultTo("available");
    t.timestamps(true, true);
  });

  // ── 30. inventory_transactions ────────────────────────────────
  await knex.schema.createTable("inventory_transactions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("item_id").notNullable().references("id").inTable("inventory_items").onDelete("RESTRICT");
    t.uuid("project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.uuid("grn_line_id").references("id").inTable("grn_lines").onDelete("SET NULL");
    t.enum("type", ["receipt", "issue", "return", "adjustment", "transfer"]).notNullable();
    t.decimal("quantity", 10, 3).notNullable();
    t.uuid("performed_by").references("id").inTable("users").onDelete("SET NULL");
    t.text("notes");
    t.timestamp("txn_date").defaultTo(knex.fn.now());
    t.timestamps(true, true);
  });

  // ── 31. invoices (AR) ─────────────────────────────────────────
  await knex.schema.createTable("invoices", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("RESTRICT");
    t.uuid("milestone_id").references("id").inTable("milestones").onDelete("SET NULL");
    t.string("invoice_no", 100).notNullable().unique();
    t.enum("status", ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"]).defaultTo("draft");
    t.decimal("amount", 14, 2).notNullable();
    t.decimal("tax_amount", 14, 2).defaultTo(0);
    t.decimal("paid_amount", 14, 2).defaultTo(0);
    t.string("currency", 3).defaultTo("USD");
    t.date("issue_date").notNullable();
    t.date("due_date").notNullable();
    t.date("paid_date");
    t.text("notes");
    t.timestamps(true, true);
  });

  // ── 32. ap_invoices (Accounts Payable) ───────────────────────
  await knex.schema.createTable("ap_invoices", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("po_id").references("id").inTable("purchase_orders").onDelete("SET NULL");
    t.uuid("project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.string("vendor_invoice_no", 100).notNullable();
    t.string("vendor_name", 200).notNullable();
    t.enum("status", ["received", "approved", "paid", "disputed", "cancelled"]).defaultTo("received");
    t.decimal("amount", 14, 2).notNullable();
    t.decimal("tax_amount", 14, 2).defaultTo(0);
    t.string("currency", 3).defaultTo("USD");
    t.date("invoice_date").notNullable();
    t.date("due_date");
    t.date("paid_date");
    t.text("notes");
    t.timestamps(true, true);
  });

  // ── 33. job_cost_lines ────────────────────────────────────────
  await knex.schema.createTable("job_cost_lines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.enum("cost_type", ["material", "labour", "overhead", "subcontract", "other"]).notNullable();
    t.text("description").notNullable();
    t.decimal("budgeted_amount", 14, 2);
    t.decimal("actual_amount", 14, 2);
    t.string("cost_code", 50);
    t.uuid("po_id").references("id").inTable("purchase_orders").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  // ── 34. hr_certs ──────────────────────────────────────────────
  await knex.schema.createTable("hr_certs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.string("cert_name", 200).notNullable();
    t.string("cert_no", 100);
    t.string("issuing_body", 200);
    t.date("issue_date");
    t.date("expiry_date");
    t.enum("status", ["active", "expiring_soon", "expired"]).defaultTo("active");
    t.timestamps(true, true);
  });

  // ── 35. training_records ──────────────────────────────────────
  await knex.schema.createTable("training_records", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("employee_id").notNullable().references("id").inTable("employees").onDelete("CASCADE");
    t.string("training_name", 300).notNullable();
    t.string("provider", 200);
    t.date("training_date");
    t.integer("duration_hours");
    t.enum("result", ["pass", "fail", "in_progress"]).defaultTo("in_progress");
    t.string("cert_ref", 100);
    t.timestamps(true, true);
  });

  // ── 36. files ─────────────────────────────────────────────────
  await knex.schema.createTable("files", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("original_name", 500).notNullable();
    t.string("storage_key", 500).notNullable().unique();  // S3/MinIO object key
    t.string("bucket", 200).notNullable();
    t.string("mime_type", 100);
    t.bigInteger("size_bytes");
    t.string("entity", 100);      // e.g. "projects", "ncrs"
    t.uuid("entity_id");
    t.uuid("uploaded_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  // ── 37. audit_log ─────────────────────────────────────────────
  await knex.schema.createTable("audit_log", (t) => {
    t.bigIncrements("id");
    t.uuid("user_id").references("id").inTable("users").onDelete("SET NULL");
    t.string("action", 50).notNullable();   // POST / PUT / PATCH / DELETE
    t.string("entity", 100).notNullable();
    t.uuid("entity_id");
    t.jsonb("old_values");
    t.jsonb("new_values");
    t.string("ip_address", 50);
    t.string("user_agent", 500);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // Prevent anyone from updating or deleting audit rows via SQL
  await knex.raw("REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC");

  // ── 38. iiot_readings (TimescaleDB hypertable) ────────────────
  await knex.schema.createTable("iiot_readings", (t) => {
    t.timestamp("time").notNullable();
    t.uuid("machine_id").notNullable();
    t.uuid("joint_id").references("id").inTable("weld_joints").onDelete("SET NULL");
    t.decimal("current_a", 6, 2);
    t.decimal("voltage_v", 5, 2);
    t.decimal("heat_input_kj_mm", 6, 3);
    t.decimal("interpass_temp_c", 5, 1);
    t.decimal("wire_feed_speed", 6, 2);
  });

  await knex.raw("SELECT create_hypertable('iiot_readings', 'time')");

  // ── Indexes ───────────────────────────────────────────────────
  await knex.raw("CREATE INDEX ON projects (status)");
  await knex.raw("CREATE INDEX ON projects (client_id)");
  await knex.raw("CREATE INDEX ON ncrs (project_id, status)");
  await knex.raw("CREATE INDEX ON itp_steps (project_id)");
  await knex.raw("CREATE INDEX ON weld_joints (project_id)");
  await knex.raw("CREATE INDEX ON wpq (employee_id, status)");
  await knex.raw("CREATE INDEX ON audit_log (entity, entity_id)");
  await knex.raw("CREATE INDEX ON audit_log (user_id)");
  await knex.raw("CREATE INDEX ON inventory_items (status)");
  await knex.raw("CREATE INDEX ON hr_certs (employee_id, status)");
  await knex.raw("CREATE INDEX ON iiot_readings (machine_id, time DESC)");
};

exports.down = async function (knex) {
  const tables = [
    "iiot_readings",
    "audit_log",
    "files",
    "training_records",
    "hr_certs",
    "job_cost_lines",
    "ap_invoices",
    "invoices",
    "inventory_transactions",
    "inventory_items",
    "grn_lines",
    "grn",
    "po_lines",
    "purchase_orders",
    "crm_activities",
    "quote_lines",
    "quotes",
    "opportunities",
    "consumable_lots",
    "nde_records",
    "weld_joints",
    "wpq",
    "pqr",
    "wps",
    "ncr_comments",
    "ncrs",
    "itp_sign_offs",
    "itp_steps",
    "material_request_lines",
    "material_requests",
    "routing_steps",
    "work_centres",
    "bom_items",
    "milestones",
    "projects",
    "employees",
    "users",
    "clients",
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
