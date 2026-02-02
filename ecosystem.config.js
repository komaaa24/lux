module.exports = {
  apps: [
    {
      name: 'click',
      script: 'src/server.js',
      cwd: __dirname, // ensure .env is loaded from project root
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: '9999'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '9999'
      }
    }
  ]
};
