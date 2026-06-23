/**
 * DocMgmt_V1 — Document management dissolved into QC & Production
 *
 * New tables:
 *   mdr_entries          — Master Document Register: project deliverable tracking
 *   drawings             — Drawing register with metadata
 *   drawing_revisions    — Per-drawing revision history + file refs
 *   transmittals         — Formal document submission records
 *   transmittal_items    — Line items (docs) within a transmittal
 *   approval_chains      — Reusable approval chain templates
 *   approval_steps       — Ordered steps within a chain
 *   approval_instances   — A chain applied to a specific document
 *   approval_actions     — Individual approve / reject / comment actions
 */

exports.up = async function (knex) {

  // ── MDR (Master Document Register) ───────────────────────────
  await knex.schema.createTable("mdr_entries", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.string("doc_number", 100).notNullable();          // ProjectCode-DocType-SeqNo-RevNo
    t.string("title", 300).notNullable();
    t.enu("doc_type", [
      "drawing", "procedure", "report", "certificate",
      "data_book", "calculation", "specification", "method_statement", "other",
    ]).notNullable();
    t.string("discipline", 100);                        // structural, piping, electrical …
    t.enu("status", [
      "not_started", "in_progress", "internal_review",
      "submitted", "client_review", "client_approved", "client_rejected",
    ]).notNullable().defaultTo("not_started");
    t.uuid("responsible_id").references("id").inTable("users").onDelete("SET NULL");
    t.date("planned_submission_date");
    t.date("actual_submission_date");
    t.date("client_response_date");
    t.string("client_doc_number", 100);                 // client's own ref number
    t.text("remarks");
    t.integer("revision").defaultTo(0);
    t.string("current_rev_letter", 5).defaultTo("A");
    t.boolean("is_mandatory").defaultTo(true);
    t.jsonb("tags").defaultTo("[]");
    t.timestamps(true, true);
    t.unique(["project_id", "doc_number"]);
    t.index(["project_id", "status"]);
    t.index(["project_id", "doc_type"]);
    t.index(["responsible_id"]);
    t.index(["planned_submission_date"]);
  });

  // ── Drawings ──────────────────────────────────────────────────
  await knex.schema.createTable("drawings", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.uuid("mdr_entry_id").references("id").inTable("mdr_entries").onDelete("SET NULL");
    t.string("drawing_number", 100).notNullable();     // ProjectCode-DRG-SeqNo
    t.string("title", 300).notNullable();
    t.enu("drawing_type", [
      "general_arrangement", "fabrication_detail", "nozzle_detail",
      "nameplate", "isometric", "p_and_id", "layout", "other",
    ]).notNullable().defaultTo("other");
    t.string("current_revision", 10).defaultTo("A");
    t.enu("status", ["draft", "under_review", "approved", "superseded", "obsolete"])
      .notNullable().defaultTo("draft");
    t.uuid("prepared_by").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("checked_by").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.date("approved_date");
    t.text("description");
    t.jsonb("linked_bom_items").defaultTo("[]");        // array of bom_item ids
    t.timestamps(true, true);
    t.timestamp("deleted_at");
    t.unique(["project_id", "drawing_number"]);
    t.index(["project_id", "status"]);
    t.index(["drawing_type"]);
  });

  await knex.schema.createTable("drawing_revisions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("drawing_id").notNullable().references("id").inTable("drawings").onDelete("CASCADE");
    t.string("revision", 10).notNullable();            // A, B, C or 1, 2, 3
    t.text("change_description").notNullable();
    t.string("file_key", 500);                          // MinIO/S3 object key
    t.string("file_name", 300);
    t.bigInteger("file_size_bytes");
    t.string("mime_type", 100).defaultTo("application/pdf");
    t.uuid("uploaded_by").references("id").inTable("users").onDelete("SET NULL");
    t.enu("approval_status", ["draft", "in_review", "approved", "superseded"])
      .notNullable().defaultTo("draft");
    t.uuid("approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("approved_at");
    t.boolean("shop_floor_notified").defaultTo(false);
    t.timestamp("shop_floor_notified_at");
    t.timestamps(true, true);
    t.unique(["drawing_id", "revision"]);
    t.index(["drawing_id", "approval_status"]);
  });

  // ── Transmittals ──────────────────────────────────────────────
  await knex.schema.createTable("transmittals", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("transmittal_no", 50).notNullable().unique();  // TRN-YYYYMMDD-NNN
    t.uuid("project_id").notNullable().references("id").inTable("projects").onDelete("CASCADE");
    t.enu("direction", ["outgoing", "incoming"]).notNullable().defaultTo("outgoing");
    t.enu("purpose", [
      "for_approval", "for_information", "for_construction",
      "for_record", "for_review_and_comment",
    ]).notNullable().defaultTo("for_approval");
    t.enu("status", [
      "draft", "sent", "received", "under_review",
      "comments_received", "approved", "rejected",
    ]).notNullable().defaultTo("draft");
    t.string("to_party", 300);                          // client name / TPI / vendor
    t.string("to_email", 500);                          // comma-separated
    t.string("from_party", 300);
    t.date("sent_date");
    t.date("response_due_date");
    t.date("response_received_date");
    t.text("subject");
    t.text("remarks");
    t.string("cover_sheet_key", 500);                   // generated PDF in MinIO
    t.uuid("created_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["project_id", "direction", "status"]);
    t.index(["response_due_date"]);
  });

  await knex.schema.createTable("transmittal_items", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("transmittal_id").notNullable().references("id").inTable("transmittals").onDelete("CASCADE");
    t.uuid("mdr_entry_id").references("id").inTable("mdr_entries").onDelete("SET NULL");
    t.uuid("drawing_id").references("id").inTable("drawings").onDelete("SET NULL");
    t.uuid("doc_register_id").references("id").inTable("doc_register").onDelete("SET NULL");
    t.string("doc_number", 100);
    t.string("title", 300);
    t.string("revision", 10);
    t.string("doc_type", 100);
    t.integer("copies").defaultTo(1);
    t.text("remarks");
    t.timestamps(true, true);
    t.index(["transmittal_id"]);
  });

  // ── Approval engine ───────────────────────────────────────────
  await knex.schema.createTable("approval_chains", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("name", 200).notNullable();
    t.enu("doc_type", [
      "drawing", "procedure", "transmittal", "mdr_entry",
      "job_card", "method_statement", "other",
    ]).notNullable();
    t.enu("mode", ["sequential", "parallel"]).notNullable().defaultTo("sequential");
    t.integer("sla_hours").defaultTo(48);               // SLA per step
    t.boolean("is_active").defaultTo(true);
    t.text("description");
    t.uuid("created_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["doc_type", "is_active"]);
  });

  await knex.schema.createTable("approval_steps", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("chain_id").notNullable().references("id").inTable("approval_chains").onDelete("CASCADE");
    t.integer("step_order").notNullable();              // 1, 2, 3 …
    t.string("step_name", 200).notNullable();           // e.g. "Checker", "Engineering Manager", "Client"
    t.enu("approver_type", ["specific_user", "role", "department"])
      .notNullable().defaultTo("role");
    t.uuid("approver_user_id").references("id").inTable("users").onDelete("SET NULL");
    t.string("approver_role", 100);                     // gm, manager, senior …
    t.string("approver_dept", 100);
    t.boolean("is_optional").defaultTo(false);
    t.timestamps(true, true);
    t.unique(["chain_id", "step_order"]);
    t.index(["chain_id"]);
  });

  await knex.schema.createTable("approval_instances", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("chain_id").notNullable().references("id").inTable("approval_chains").onDelete("RESTRICT");
    // polymorphic entity reference
    t.enu("entity_type", ["drawing", "mdr_entry", "transmittal", "doc_register"])
      .notNullable();
    t.uuid("entity_id").notNullable();
    t.enu("status", [
      "pending", "in_progress", "approved", "rejected", "withdrawn", "escalated",
    ]).notNullable().defaultTo("pending");
    t.integer("current_step_order").defaultTo(1);
    t.uuid("submitted_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("submitted_at");
    t.timestamp("completed_at");
    t.text("submitter_notes");
    t.timestamps(true, true);
    t.index(["entity_type", "entity_id"]);
    t.index(["status", "current_step_order"]);
  });

  await knex.schema.createTable("approval_actions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("instance_id").notNullable().references("id").inTable("approval_instances").onDelete("CASCADE");
    t.uuid("step_id").notNullable().references("id").inTable("approval_steps").onDelete("RESTRICT");
    t.integer("step_order").notNullable();
    t.uuid("actor_id").references("id").inTable("users").onDelete("SET NULL");
    t.enu("action", ["approved", "rejected", "commented", "escalated", "reassigned"])
      .notNullable();
    t.text("comments");
    t.string("signature_ref", 200);                    // digital signature ref if applicable
    t.timestamp("acted_at").notNullable().defaultTo(knex.raw("NOW()"));
    t.timestamps(true, true);
    t.index(["instance_id", "step_order"]);
    t.index(["actor_id"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("approval_actions");
  await knex.schema.dropTableIfExists("approval_instances");
  await knex.schema.dropTableIfExists("approval_steps");
  await knex.schema.dropTableIfExists("approval_chains");
  await knex.schema.dropTableIfExists("transmittal_items");
  await knex.schema.dropTableIfExists("transmittals");
  await knex.schema.dropTableIfExists("drawing_revisions");
  await knex.schema.dropTableIfExists("drawings");
  await knex.schema.dropTableIfExists("mdr_entries");
};
