#!/bin/sh
set -e

NODE_ENV="${NODE_ENV:-development}"

echo "[entrypoint] NODE_ENV=${NODE_ENV}"
echo "[entrypoint] Running database migrations..."
npx knex migrate:latest --knexfile knexfile.js --env "${NODE_ENV}"

if [ "${SEED_DB:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database..."
  npx knex seed:run --knexfile knexfile.js --env "${NODE_ENV}"
fi

echo "[entrypoint] Starting API server..."
exec node src/index.js
