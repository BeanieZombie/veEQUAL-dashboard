import { db } from './db.ts';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export async function runAllSql(): Promise<void> {
  console.log('Running SQL transformations...');

  const sqlDir = 'sql';

  try {
    const files = await readdir(sqlDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    console.log(`Found ${sqlFiles.length} SQL files to execute`);

    for (const file of sqlFiles) {
      console.log(`Executing ${file}...`);

      const filepath = join(sqlDir, file);
      let sql = await readFile(filepath, 'utf-8');

      // Clean up comments and normalize whitespace
      // First remove multi-line comments
      sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

      // Then process line by line to remove single-line comments
      sql = sql.split('\n').map(line => {
        // Remove SQL comments (--) and JavaScript comments (//)
        // But be careful not to remove // that might be part of a URL or other data
        let cleanLine = line;

        // Remove -- comments (standard SQL)
        const sqlCommentIndex = cleanLine.indexOf('--');
        if (sqlCommentIndex !== -1) {
          cleanLine = cleanLine.substring(0, sqlCommentIndex);
        }

        // Remove // comments (JavaScript style)
        const jsCommentIndex = cleanLine.indexOf('//');
        if (jsCommentIndex !== -1) {
          cleanLine = cleanLine.substring(0, jsCommentIndex);
        }

        return cleanLine.trimEnd();
      }).join('\n');

      // Remove empty lines and normalize whitespace
      sql = sql.replace(/^\s*[\r\n]/gm, '').trim();

      if (!sql.trim()) { // Skip if the file is empty after comment removal
        console.log(`${file} is empty after comment removal, skipping.`);
        continue;
      }

      try {
        await db.query(sql);
        console.log(`${file} completed successfully`);
      } catch (error) {
        console.error(`Error executing ${file}:`, error);
        throw error;
      }
    }

    console.log('All SQL transformations completed');

  } catch (error) {
    console.error('Error reading SQL directory:', error);
    throw error;
  }
}
