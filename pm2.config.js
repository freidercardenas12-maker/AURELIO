module.exports = {
  apps: [{
    name: 'aurelio',
    script: 'src/index.js',
    watch: false,
    max_restarts: 10,
    restart_delay: 3000,
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/error.log',
    out_file: 'logs/aurelio.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
