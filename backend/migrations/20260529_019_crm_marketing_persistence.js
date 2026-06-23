/**
 * NexaForge ERP — S-19 CRM / Marketing persistence
 * Adds real storage for features that previously lived only in frontend memory:
 *   quote log + revision history, quote approvals, CRM appointments,
 *   contacts, pre-qualification registry, competitor intel + bid outcomes.
 *
 * Dialect-aware: runs on PostgreSQL (uuid PKs via gen_random_uuid) and on
 * SQLite/local (text PKs supplied by the application layer).
 */

function isPg(knex) {
  const c = knex.client.config.client;
  return c === "pg" || c === "postgresql";
}

// Primary-key column that works on both dialects. On SQLite the id is generated
// by the DB (random hex) when the app doesn't supply one.
function addId(knex, t) {
  if (isPg(knex)) {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
  } else {
    t.string("id", 64).primary().defaultTo(knex.raw("(lower(hex(randomblob(16))))"));
  }
}

exports.up = async function (knex) {
  // ── quote_log — one row per quotation against an RFQ/opportunity ──
  await knex.schema.createTable("quote_log", (t) => {
    addId(knex, t);
    t.string("ref", 50).notNullable().unique(); // e.g. Q-2025-031
    t.uuid("opportunity_id").references("id").inTable("opportunities").onDelete("SET NULL");
    t.string("rfq_no", 100);          // display ref, e.g. OPP-005 / ITT-2025-018
    t.string("client_name", 200);
    t.string("project", 300);
    t.string("owner", 150);
    t.enum("status", ["draft", "submitted", "pending", "negotiation", "won", "lost", "revised"]).defaultTo("submitted");
    t.date("valid_until");
    t.string("currency", 3).defaultTo("USD");
    t.timestamps(true, true);
  });

  // ── quote_revisions — full revision history per quote_log row ──
  await knex.schema.createTable("quote_revisions", (t) => {
    addId(knex, t);
    t.string("quote_log_id", 64).notNullable().references("id").inTable("quote_log").onDelete("CASCADE");
    t.string("rev", 10).notNullable();       // Rev A / Rev B …
    t.date("rev_date").notNullable();
    t.decimal("value", 14, 2).notNullable();
    t.decimal("margin", 6, 2);
    t.text("note");
    t.timestamps(true, true);
  });

  // ── quote_approvals — margin-gated sign-off queue ──
  await knex.schema.createTable("quote_approvals", (t) => {
    addId(knex, t);
    t.string("ref", 50).notNullable().unique(); // QA-001
    t.string("opp_ref", 100);
    t.string("quote", 300);
    t.string("client_name", 200);
    t.string("rev", 10);
    t.decimal("sell", 14, 2);
    t.decimal("cost", 14, 2);
    t.decimal("margin", 6, 2);
    t.enum("status", ["pending", "approved", "rejected"]).defaultTo("pending");
    t.string("requested_by", 150);
    t.date("requested_on");
    t.string("decided_by", 150);
    t.date("decided_on");
    t.text("reason");
    t.timestamps(true, true);
  });

  // ── crm_appointments — calendar items / trackers ──
  await knex.schema.createTable("crm_appointments", (t) => {
    addId(knex, t);
    t.string("ref", 50);
    t.enum("type", ["meeting", "call", "sitevisit", "followup"]).defaultTo("meeting");
    t.string("title", 300).notNullable();
    t.string("client_name", 200);
    t.timestamp("start_at").notNullable();
    t.integer("duration_min").defaultTo(60);
    t.string("location", 200);
    t.string("owner", 150);
    t.text("notes");
    t.timestamps(true, true);
  });

  // ── crm_contacts — contact manager with follow-up tracking ──
  await knex.schema.createTable("crm_contacts", (t) => {
    addId(knex, t);
    t.string("ref", 50);
    t.string("name", 200).notNullable();
    t.string("title", 200);
    t.string("company", 200);
    t.string("email", 200);
    t.string("phone", 50);
    t.date("last_contact");
    t.date("follow_up_due");
    t.text("follow_up_note");
    t.string("avatar_bg", 20);
    t.string("initials", 8);
    t.timestamps(true, true);
  });

  // ── prequalifications — vendor pre-qual registry per authority ──
  await knex.schema.createTable("prequalifications", (t) => {
    addId(knex, t);
    t.string("ref", 50).notNullable().unique(); // PQ-001
    t.string("authority", 200).notNullable();
    t.string("category", 300);
    t.enum("status", ["active", "expiring", "expired", "pending"]).defaultTo("pending");
    t.date("submitted");
    t.date("expiry");
    t.string("contact", 200);
    t.timestamps(true, true);
  });

  // ── competitors — competitor registry ──
  await knex.schema.createTable("competitors", (t) => {
    addId(knex, t);
    t.string("ref", 50);
    t.string("name", 200).notNullable();
    t.string("region", 150);
    t.string("size", 50);
    t.json("strengths");   // string[] (stored as TEXT on SQLite)
    t.json("weaknesses");
    t.integer("win_rate");
    t.decimal("avg_gap", 6, 2);
    t.timestamps(true, true);
  });

  // ── bid_outcomes — win/loss record vs competitors ──
  await knex.schema.createTable("bid_outcomes", (t) => {
    addId(knex, t);
    t.string("tender", 300).notNullable();
    t.enum("result", ["won", "lost", "quoted"]).defaultTo("quoted");
    t.decimal("our_price", 14, 2);
    t.string("competitor", 200);
    t.decimal("their_price", 14, 2);
    t.decimal("gap", 6, 2);
    t.text("notes");
    t.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  const tables = [
    "bid_outcomes",
    "competitors",
    "prequalifications",
    "crm_contacts",
    "crm_appointments",
    "quote_approvals",
    "quote_revisions",
    "quote_log",
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
