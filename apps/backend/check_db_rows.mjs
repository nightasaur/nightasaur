import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkRowCounts() {
  try {
    const db = await open({
      filename: path.join(__dirname, 'prisma/dev.db'),
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY
    });

    // 獲取所有應用程式表格
    const tables = await db.all(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name`
    );

    console.log('TABLE,ROW_COUNT');
    let totalRows = 0;
    let tablesWithData = 0;
    let emptyTables = 0;

    for (const table of tables) {
      try {
        const result = await db.get(`SELECT COUNT(*) as count FROM "${table.name}"`);
        const count = result.count;
        console.log(`${table.name},${count}`);
        totalRows += count;
        if (count > 0) {
          tablesWithData++;
        } else {
          emptyTables++;
        }
      } catch (error) {
        console.error(`Error counting rows in ${table.name}:`, error.message);
        console.log(`${table.name},ERROR`);
      }
    }

    console.log('\nSummary:');
    console.log(`Tables with data: ${tablesWithData}`);
    console.log(`Empty tables: ${emptyTables}`);
    console.log(`Total rows across application tables: ${totalRows}`);

    await db.close();
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

checkRowCounts();