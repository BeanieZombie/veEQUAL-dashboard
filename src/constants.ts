export const VE_EQUAL    = "0x3045119766352fF250b3d45312Bd0973CBF7235a";
export const DB_FILE     = "data/veEqual.duckdb";
export const MD_FILE     = "veEQUAL.md";
export const CHUNK_SIZE  = 200n; // Reduced from 500 to be more conservative with rate limits
export const PARALLEL    = 2;    // Reduced from 4 to minimize concurrent requests
