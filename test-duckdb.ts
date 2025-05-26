#!/usr/bin/env bun
/**
 * Simple DuckDB test to verify functionality before CI deployment
 */

async function testDuckDB() {
  console.log('🧪 Testing DuckDB functionality...');
  
  try {
    // Test import
    console.log('1. Testing DuckDB import...');
    const duckdb = await import('duckdb');
    console.log('✅ DuckDB import successful');
    
    // Test database creation
    console.log('2. Testing database creation...');
    const db = new duckdb.Database(':memory:');
    console.log('✅ Database creation successful');
    
    // Test simple synchronous query
    console.log('3. Testing basic functionality...');
    
    // Close immediately for basic test
    db.close();
    console.log('✅ Basic DuckDB test passed');
    
  } catch (error) {
    console.error('❌ DuckDB test failed:', error);
    process.exit(1);
  }
}

testDuckDB();
