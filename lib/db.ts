import * as duckdb from 'duckdb';
import { DB_FILE } from '../src/constants.ts';

// Create data directory if it doesn't exist
await Bun.write(DB_FILE.replace('/veEqual.duckdb', '/.gitkeep'), '');

// Initialize DuckDB database
const db_native = new duckdb.Database(DB_FILE);

// Create venfts table if it doesn't exist
await new Promise<void>((resolve, reject) => {
  db_native.run(`
    CREATE TABLE IF NOT EXISTS venfts (
      token_id BIGINT PRIMARY KEY,
      owner VARCHAR NOT NULL,
      balance_raw VARCHAR NOT NULL,
      balance_formatted DOUBLE NOT NULL,
      unlock_timestamp BIGINT NOT NULL,
      unlock_date VARCHAR,
      snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

// Migration: Add balance_formatted column if it doesn't exist
await new Promise<void>((resolve, reject) => {
  db_native.run(`
    ALTER TABLE venfts ADD COLUMN IF NOT EXISTS balance_formatted DOUBLE
  `, (err) => {
    if (err) {
      // Column might already exist, or this might be a different error
      // Check if it's because the column already exists
      db_native.all("PRAGMA table_info(venfts)", (pragmaErr: any, rows: any[]) => {
        if (pragmaErr) {
          reject(pragmaErr);
        } else {
          const hasBalanceFormatted = rows.some(row => row.name === 'balance_formatted');
          if (hasBalanceFormatted) {
            console.log('balance_formatted column already exists');
            resolve();
          } else {
            reject(err);
          }
        }
      });
    } else {
      console.log('Added balance_formatted column to venfts table');
      resolve();
    }
  });
});

// Migration: Populate balance_formatted for existing records
await new Promise<void>((resolve, reject) => {
  db_native.run(`
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

export const db = {
  query: async (sql: string) => {
    return new Promise((resolve, reject) => {
      db_native.all(sql, (err: any, rows: any[]) => {
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
    db_native.close();
  }
};
