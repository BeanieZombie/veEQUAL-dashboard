import * as duckdb from 'duckdb';
import { DB_FILE } from '../src/constants.ts';

let db_native: duckdb.Database | null = null;
let initialized = false;

async function initializeDatabase() {
  if (initialized) return;

  try {
    console.log('Initializing DuckDB database...');

    // Create data directory if it doesn't exist
    await Bun.write(DB_FILE.replace('/veEqual.duckdb', '/.gitkeep'), '');

    // Initialize DuckDB database
    db_native = new duckdb.Database(DB_FILE);

    // Create venfts table if it doesn't exist
    console.log('Creating venfts table if needed...');
    await new Promise<void>((resolve, reject) => {
      db_native!.run(`
        CREATE TABLE IF NOT EXISTS venfts (
          token_id BIGINT PRIMARY KEY,
          owner VARCHAR NOT NULL,
          balance_raw VARCHAR NOT NULL,
          balance_formatted DOUBLE NOT NULL,
          amount_raw VARCHAR,
          amount_formatted DOUBLE,
          unlock_timestamp BIGINT NOT NULL,
          unlock_date VARCHAR,
          snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Migration: Add columns if they don't exist
    console.log('Checking for column migrations...');
    await new Promise<void>((resolve, reject) => {
      db_native!.run(`
        ALTER TABLE venfts ADD COLUMN IF NOT EXISTS balance_formatted DOUBLE
      `, (err) => {
        if (err && !err.message.includes('already exists')) {
          reject(err);
        } else {
          console.log('balance_formatted column ready');
          resolve();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      db_native!.run(`
        ALTER TABLE venfts ADD COLUMN IF NOT EXISTS amount_raw VARCHAR
      `, (err) => {
        if (err && !err.message.includes('already exists')) {
          reject(err);
        } else {
          console.log('amount_raw column ready');
          resolve();
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      db_native!.run(`
        ALTER TABLE venfts ADD COLUMN IF NOT EXISTS amount_formatted DOUBLE
      `, (err) => {
        if (err && !err.message.includes('already exists')) {
          reject(err);
        } else {
          console.log('amount_formatted column ready');
          resolve();
        }
      });
    });

    // Migration: Populate balance_formatted for existing records
    console.log('Migrating balance_formatted values...');
    await new Promise<void>((resolve, reject) => {
      db_native!.run(`
        UPDATE venfts
        SET balance_formatted = CAST(balance_raw AS DOUBLE) / 1e18
        WHERE balance_formatted IS NULL OR balance_formatted = 0
      `, (err) => {
        if (err) {
          console.error('Failed to migrate balance_formatted values:', err);
          reject(err);
        } else {
          console.log('Migrated balance_formatted values for existing records');
          resolve();
        }
      });
    });

    initialized = true;
    console.log('✅ Database initialization completed successfully');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export const db = {
  query: async (sql: string) => {
    if (!initialized) {
      await initializeDatabase(); // Initialize only if not already done
    }
    return new Promise((resolve, reject) => {
      db_native!.all(sql, (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            toArray: () => rows || []
          });
        }
      });
    });
  },
  close: () => {
    if (db_native) {
      db_native.close();
    }
    initialized = false;
  }
};
