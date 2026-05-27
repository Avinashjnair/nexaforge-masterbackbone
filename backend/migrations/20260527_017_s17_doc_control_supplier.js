/**
 * S-17B — Document Control (ISO 9001)
 * S-17C — Supplier Portal
 *
 * Tables:
 *   doc_register         — master document list (controlled documents)
 *   doc_revisions        — revision history (full text + approval chain)
 *   doc_links            — many-to-many: document ↔ project | ncr | itp
 *   supplier_contacts    — supplier company + portal access
 *   supplier_rfq         — RFQ sent to suppliers
 *   supplier_rfq_responses — supplier bids / quotes on RFQ
 *   supplier_po_acks     — PO acknowledgement by supplier
 *   supplier_deliveries  — expected delivery updates by supplier
 *   supplier_scorecards  — quarterly scorecard record
 *   push_subscriptions   — Web Push VAPID subscriptions (S-17D)
 */

exports.up = async function (knex) {
  // ── S-17B: Document Control ─────────────────────────────────

  await knex.schema.createTable("doc_register", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("doc_no", 50).notNullable().unique();  // e.g. QP-001, WI-023
    t.string("title", 300).notNullable();
    t.enu("doc_type", [
      "quality_procedure", "work_instruction", "form", "drawing",
      "specification", "standard", "external_doc", "record",
    ]).notNullable();
    t.string("department", 100).notNullable();
    t.string("current_rev", 10).notNullable().defaultTo("A");
    t.enu("status", ["draft", "under_review", "approved", "obsolete", "superseded"])
      .notNullable().defaultTo("draft");
    t.uuid("owner_id").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.date("approved_date");
    t.date("next_review_date");
    t.text("description");
    t.jsonb("tags").defaultTo("[]");
    t.timestamps(true, true);
    t.timestamp("deleted_at");
    t.index(["department", "status"]);
    t.index(["doc_type"]);
    t.index(["next_review_date"]);
  });

  await knex.schema.createTable("doc_revisions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("doc_id").notNullable().references("id").inTable("doc_register").onDelete("CASCADE");
    t.string("rev", 10).notNullable();   // A, B, C, 1, 2 …
    t.text("change_description").notNullable();
    t.text("content");                   // full text / HTML of document body (optional)
    t.string("file_key", 500);           // MinIO/S3 object key for the file attachment
    t.string("file_name", 300);
    t.bigInteger("file_size_bytes");
    t.uuid("prepared_by").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("reviewed_by").references("id").inTable("users").onDelete("SET NULL");
    t.uuid("approved_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamp("prepared_at");
    t.timestamp("reviewed_at");
    t.timestamp("approved_at");
    t.enu("approval_status", ["draft", "in_review", "approved", "rejected"])
      .notNullable().defaultTo("draft");
    t.text("rejection_reason");
    t.timestamps(true, true);
    t.unique(["doc_id", "rev"]);
    t.index(["doc_id", "approval_status"]);
  });

  await knex.schema.createTable("doc_links", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("doc_id").notNullable().references("id").inTable("doc_register").onDelete("CASCADE");
    t.enu("entity_type", ["project", "ncr", "itp", "weld_joint"]).notNullable();
    t.uuid("entity_id").notNullable();
    t.boolean("is_mandatory").defaultTo(false);  // mandatory doc on this entity type
    t.uuid("linked_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.unique(["doc_id", "entity_type", "entity_id"]);
    t.index(["entity_type", "entity_id"]);
  });

  // ── S-17C: Supplier Portal ────────────────────────────────────

  await knex.schema.createTable("supplier_contacts", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("company_name", 200).notNullable();
    t.string("contact_name", 150);
    t.string("email", 255).notNullable().unique();
    t.string("phone", 50);
    t.string("country", 100);
    t.enu("status", ["active", "inactive", "blacklisted"]).defaultTo("active");
    t.enu("category", [
      "raw_material", "consumable", "equipment", "subcontractor",
      "calibration", "nde_service", "other",
    ]).defaultTo("other");
    t.integer("rating").checkBetween([1, 5]);  // 1–5 overall rating
    t.text("notes");
    t.string("portal_token_hash", 255);  // hashed token for external portal access
    t.timestamp("portal_token_expires_at");
    t.timestamp("last_portal_access");
    t.timestamps(true, true);
    t.index(["status", "category"]);
  });

  await knex.schema.createTable("supplier_rfq", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("rfq_no", 50).notNullable().unique();
    t.uuid("project_id").references("id").inTable("projects").onDelete("SET NULL");
    t.uuid("material_request_id").references("id").inTable("material_requests").onDelete("SET NULL");
    t.string("title", 300).notNullable();
    t.text("description");
    t.jsonb("line_items").defaultTo("[]");  // [{item, qty, unit, spec}]
    t.date("response_due_date").notNullable();
    t.enu("status", ["draft", "sent", "responses_received", "awarded", "cancelled"])
      .notNullable().defaultTo("draft");
    t.uuid("created_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.index(["project_id"]);
    t.index(["status", "response_due_date"]);
  });

  await knex.schema.createTable("supplier_rfq_invitations", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("rfq_id").notNullable().references("id").inTable("supplier_rfq").onDelete("CASCADE");
    t.uuid("supplier_id").notNullable().references("id").inTable("supplier_contacts").onDelete("CASCADE");
    t.timestamp("sent_at");
    t.timestamp("viewed_at");
    t.unique(["rfq_id", "supplier_id"]);
  });

  await knex.schema.createTable("supplier_rfq_responses", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("rfq_id").notNullable().references("id").inTable("supplier_rfq").onDelete("CASCADE");
    t.uuid("supplier_id").notNullable().references("id").inTable("supplier_contacts").onDelete("CASCADE");
    t.decimal("total_amount", 15, 2);
    t.string("currency", 10).defaultTo("USD");
    t.integer("lead_time_days");
    t.date("valid_until");
    t.jsonb("line_items").defaultTo("[]");  // [{item, qty, unit_price, total}]
    t.text("notes");
    t.enu("status", ["submitted", "shortlisted", "awarded", "rejected"]).defaultTo("submitted");
    t.string("file_key", 500);  // uploaded quote document
    t.timestamps(true, true);
    t.unique(["rfq_id", "supplier_id"]);
    t.index(["rfq_id", "status"]);
  });

  await knex.schema.createTable("supplier_po_acks", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("purchase_order_id").notNullable().references("id").inTable("purchase_orders").onDelete("CASCADE");
    t.uuid("supplier_id").references("id").inTable("supplier_contacts").onDelete("SET NULL");
    t.enu("status", ["pending", "acknowledged", "queried", "rejected"]).defaultTo("pending");
    t.timestamp("acknowledged_at");
    t.date("committed_delivery_date");
    t.text("supplier_notes");
    t.timestamps(true, true);
    t.index(["purchase_order_id"]);
  });

  await knex.schema.createTable("supplier_deliveries", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("purchase_order_id").notNullable().references("id").inTable("purchase_orders").onDelete("CASCADE");
    t.uuid("supplier_id").references("id").inTable("supplier_contacts").onDelete("SET NULL");
    t.date("expected_date").notNullable();
    t.string("tracking_ref", 200);
    t.string("carrier", 200);
    t.text("notes");
    t.enu("status", ["scheduled", "in_transit", "delivered", "delayed"]).defaultTo("scheduled");
    t.timestamps(true, true);
    t.index(["purchase_order_id"]);
    t.index(["expected_date", "status"]);
  });

  await knex.schema.createTable("supplier_scorecards", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("supplier_id").notNullable().references("id").inTable("supplier_contacts").onDelete("CASCADE");
    t.integer("year").notNullable();
    t.integer("quarter").notNullable().checkBetween([1, 4]);
    t.decimal("otd_score",     5, 2);   // 0–100
    t.decimal("quality_score", 5, 2);   // 0–100
    t.decimal("price_score",   5, 2);   // 0–100
    t.decimal("response_score",5, 2);   // 0–100
    t.decimal("overall_score", 5, 2);   // weighted average
    t.text("comments");
    t.uuid("evaluated_by").references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
    t.unique(["supplier_id", "year", "quarter"]);
    t.index(["supplier_id", "year"]);
  });
};

  // ── S-17D: Push subscriptions ─────────────────────────────
  await knex.schema.createTable("push_subscriptions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.text("endpoint").notNullable();
    t.string("p256dh", 255);
    t.string("auth", 255);
    t.string("user_agent", 300);
    t.timestamps(true, true);
    t.unique(["user_id", "endpoint"]);
    t.index(["user_id"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("push_subscriptions");
  await knex.schema.dropTableIfExists("supplier_scorecards");
  await knex.schema.dropTableIfExists("supplier_deliveries");
  await knex.schema.dropTableIfExists("supplier_po_acks");
  await knex.schema.dropTableIfExists("supplier_rfq_responses");
  await knex.schema.dropTableIfExists("supplier_rfq_invitations");
  await knex.schema.dropTableIfExists("supplier_rfq");
  await knex.schema.dropTableIfExists("supplier_contacts");
  await knex.schema.dropTableIfExists("doc_links");
  await knex.schema.dropTableIfExists("doc_revisions");
  await knex.schema.dropTableIfExists("doc_register");
};
