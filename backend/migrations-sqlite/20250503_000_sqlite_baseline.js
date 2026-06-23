/**
 * NexaForge ERP — SQLite baseline (local storage target).
 *
 * Rather than maintaining a hand-written parallel schema, this baseline RE-APPLIES
 * the canonical Postgres migration set (../migrations) through a dialect shim that
 * rewrites or no-ops the constructs SQLite can't run:
 *   - gen_random_uuid()  → (lower(hex(randomblob(16))))   [working random ids]
 *   - NOW()              → CURRENT_TIMESTAMP
 *   - CREATE EXTENSION / create_hypertable / timescaledb / materialized views
 *   - REVOKE … / ALTER … ADD|DROP CONSTRAINT / unnamed "CREATE INDEX ON …"
 *     → no-op (CHECK constraints + Timescale are simply absent locally)
 *
 * The Postgres migrations themselves are never modified, so the cloud path is
 * unaffected. New migrations are picked up automatically (sorted by filename).
 */

const fs = require("fs");
const path = require("path");

const PG_MIGRATIONS_DIR = path.join(__dirname, "..", "migrations");

// Statements that have no SQLite equivalent — resolve to a harmless no-op.
const PG_ONLY = /CREATE EXTENSION|create_hypertable|timescaledb|compression_policy|continuous_aggregate|MATERIALIZED VIEW|REVOKE\b|ADD\s+CONSTRAINT|DROP\s+CONSTRAINT|CREATE\s+INDEX\s+ON\b/i;

// Whole migration files that are exclusively Postgres/TimescaleDB and carry no
// schema needed locally — skipped entirely.
const SKIP_FILES = new Set(["20250503_003_timescale_compression.js"]);

function shim(knex) {
  const realRaw = knex.raw.bind(knex);
  const noop = () => Promise.resolve([]);

  return new Proxy(knex, {
    get(target, prop, receiver) {
      if (prop === "raw") {
        return (sql, bindings) => {
          const s = String(sql);
          if (/gen_random_uuid/i.test(s)) return realRaw("(lower(hex(randomblob(16))))");
          if (/^\s*NOW\(\)\s*$/i.test(s)) return realRaw("CURRENT_TIMESTAMP");
          if (PG_ONLY.test(s)) return noop();
          return bindings === undefined ? realRaw(sql) : realRaw(sql, bindings);
        };
      }
      const v = Reflect.get(target, prop, receiver);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

function loadPgMigrations() {
  return fs
    .readdirSync(PG_MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".js") && !SKIP_FILES.has(f))
    .sort()
    .map((f) => ({ name: f, mod: require(path.join(PG_MIGRATIONS_DIR, f)) }));
}

exports.up = async function (knex) {
  const sk = shim(knex);
  for (const { name, mod } of loadPgMigrations()) {
    if (typeof mod.up !== "function") continue;
    try {
      await mod.up(sk);
    } catch (err) {
      throw new Error(`[sqlite-baseline] failed applying ${name}: ${err.message}`);
    }
  }
};

exports.down = async function (knex) {
  const sk = shim(knex);
  for (const { name, mod } of loadPgMigrations().reverse()) {
    if (typeof mod.down !== "function") continue;
    try {
      await mod.down(sk);
    } catch (err) {
      // best-effort teardown
      console.warn(`[sqlite-baseline] down ${name}: ${err.message}`);
    }
  }
};
