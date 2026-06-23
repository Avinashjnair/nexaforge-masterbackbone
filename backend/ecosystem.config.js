'use strict';

module.exports = {
  apps: [
    {
      name: 'nexaforge-api',
      script: 'src/index.js',
      instances: 'max',          // one per CPU core
      exec_mode: 'cluster',
      node_args: '--max-old-space-size=512',

      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Graceful reload — wait for in-flight requests to finish
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,

      // Log rotation (requires pm2-logrotate module)
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/nexaforge/api-error.log',
      out_file:   '/var/log/nexaforge/api-out.log',
      merge_logs: true,

      // Auto-restart on crash
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 2000,
    },
  ],
};
