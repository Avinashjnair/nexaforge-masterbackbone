/**
 * S-17 — Auth 2FA and reset token schema
 */

exports.up = async function (knex) {
  await knex.schema.alterTable("users", (t) => {
    t.string("two_factor_secret", 64).nullable();
    t.boolean("two_factor_enabled").defaultTo(false);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("users", (t) => {
    t.dropColumn("two_factor_secret");
    t.dropColumn("two_factor_enabled");
  });
};
