const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { config } = require('../config');
const logger = require('../logger');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initDb() {
  const migrationsPath = path.join(__dirname, 'migrations.sql');

  try {
    // Test database connection first
    logger.info('Testing database connection...');
    const testClient = await pool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
    logger.info('Database connection successful');

    // Read and execute migrations
    const sql = fs.readFileSync(migrationsPath, 'utf8');
    logger.info('Running DB migrations');

    // Run migration in a transaction for safety
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      logger.info('DB migrations complete');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Migration failed, rolled back', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      logger.error(`Cannot connect to database at ${config.db.host}:${config.db.port}`, err);
    } else if (err.code === '3D000') {
      logger.error(`Database "${config.db.database}" does not exist`, err);
    } else if (err.code === '28P01') {
      logger.error('Database authentication failed - check username/password', err);
    } else {
      logger.error('Failed to initialize database', err);
    }
    throw err;
  }
}

module.exports = {
  pool,
  query,
  initDb
};

