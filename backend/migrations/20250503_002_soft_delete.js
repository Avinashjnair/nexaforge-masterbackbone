// Add soft-delete support to projects table
exports.up = async function (knex) {
  await knex.schema.alterTable("projects", (t) => {
    t.timestamp("deleted_at").nullable().defaultTo(null);
  });
  await knex.raw("CREATE INDEX ON projects (deleted_at) WHERE deleted_at IS NULL");
};

exports.down = async function (knex) {
  await knex.schema.alterTable("projects", (t) => {
    t.dropColumn("deleted_at");
  });
};
