/**
 * TimescaleDB compression policy for iiot_readings.
 * Chunks older than 7 days are compressed, saving ~90% storage.
 * Continuous aggregate for 1-minute averages enables fast dashboard queries.
 */

exports.up = async function (knex) {
  // Enable compression on the hypertable
  await knex.raw(`
    ALTER TABLE iiot_readings SET (
      timescaledb.compress,
      timescaledb.compress_segmentby = 'machine_id',
      timescaledb.compress_orderby   = 'time DESC'
    )
  `);

  // Auto-compress chunks older than 7 days
  await knex.raw(`
    SELECT add_compression_policy('iiot_readings', INTERVAL '7 days')
  `);

  // Continuous aggregate: 1-minute average per machine
  await knex.raw(`
    CREATE MATERIALIZED VIEW iiot_1min_avg
    WITH (timescaledb.continuous) AS
    SELECT
      time_bucket('1 minute', time)  AS bucket,
      machine_id,
      joint_id,
      AVG(current_a)                 AS avg_current_a,
      AVG(voltage_v)                 AS avg_voltage_v,
      AVG(heat_input_kj_mm)          AS avg_heat_input,
      MAX(heat_input_kj_mm)          AS max_heat_input,
      AVG(interpass_temp_c)          AS avg_interpass_temp,
      MAX(interpass_temp_c)          AS max_interpass_temp,
      COUNT(*)                       AS sample_count
    FROM iiot_readings
    GROUP BY bucket, machine_id, joint_id
    WITH NO DATA
  `);

  // Refresh policy: keep aggregate up to date, retain 90 days
  await knex.raw(`
    SELECT add_continuous_aggregate_policy('iiot_1min_avg',
      start_offset => INTERVAL '90 days',
      end_offset   => INTERVAL '1 minute',
      schedule_interval => INTERVAL '1 minute'
    )
  `);
};

exports.down = async function (knex) {
  await knex.raw("DROP MATERIALIZED VIEW IF EXISTS iiot_1min_avg CASCADE");
  await knex.raw("SELECT remove_compression_policy('iiot_readings', if_exists => true)");
  await knex.raw("ALTER TABLE iiot_readings SET (timescaledb.compress = false)");
};
