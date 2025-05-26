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
