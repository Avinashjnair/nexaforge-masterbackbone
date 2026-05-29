require("dotenv").config();

/** @type {import('knex').Knex.Config} */
module.exports = {
  // Local single-machine storage — zero infra, single SQLite file.
  // Run with NODE_ENV=local. Requires the better-sqlite3 driver.
  local: {
    client: "better-sqlite3",
    connection: {
      filename: process.env.SQLITE_FILE || "./data/nexaforge.sqlite",
    },
    useNullAsDefault: true,
    migrations: {
      // SQLite-native baseline that re-applies the Postgres migration set
      // through a dialect shim (see migrations-sqlite/).
      directory: "./migrations-sqlite",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./seeds",
    },
    pool: {
      // Enforce foreign keys on every SQLite connection.
      afterCreate: (conn, done) => {
        conn.pragma ? conn.pragma("foreign_keys = ON") : conn.run("PRAGMA foreign_keys = ON");
        done(null, conn);
      },
    },
  },

  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "nexaforge",
      user: process.env.DB_USER || "nexaforge_api",
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./seeds",
    },
    pool: { min: 2, max: 10 },
  },

  staging: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "nexaforge",
      user: process.env.DB_USER || "nexaforge_api",
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./seeds",
    },
    pool: { min: 2, max: 10 },
  },

  production: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./seeds",
    },
    pool: { min: 2, max: 20 },
  },
};
