const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma/dev.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }
  
  // 獲取所有應用程式表格
  db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name`, (err, tables) => {
    if (err) {
      console.error('Error fetching tables:', err.message);
      db.close();
      return;
    }
    
    console.log('TABLE,ROW_COUNT');
    let totalRows = 0;
    let tablesWithData = 0;
    let emptyTables = 0;
    
    const processTable = (index) => {
      if (index >= tables.length) {
        console.log('\nSummary:');
        console.log(`Tables with data: ${tablesWithData}`);
        console.log(`Empty tables: ${emptyTables}`);
        console.log(`Total rows across application tables: ${totalRows}`);
        db.close();
        return;
      }
      
      const table = tables[index];
      db.get(`SELECT COUNT(*) as count FROM "${table.name}"`, (err, result) => {
        if (err) {
          console.error(`Error counting rows in ${table.name}:`, err.message);
          console.log(`${table.name},ERROR`);
        } else {
          const count = result.count;
          console.log(`${table.name},${count}`);
          totalRows += count;
          if (count > 0) {
            tablesWithData++;
          } else {
            emptyTables++;
          }
        }
        processTable(index + 1);
      });
    };
    
    processTable(0);
  });
});