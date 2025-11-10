const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./financial_dashboard.db');
const jsonData = JSON.parse(fs.readFileSync('../src/assets/Analytics_Test_Data.json', 'utf8'));

console.log(`JSON file contains ${jsonData.length} documents`);

// Check what's in the database
db.get("SELECT COUNT(*) as count FROM invoices", (err, row) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log(`Database contains ${row.count} invoices`);
  
  // Check vendors
  db.get("SELECT COUNT(*) as count FROM vendors", (err, row) => {
    console.log(`Database contains ${row.count} vendors`);
    
    // Check documents
    db.get("SELECT COUNT(*) as count FROM documents", (err, row) => {
      console.log(`Database contains ${row.count} documents`);
      
      // Sample data from each table
      db.all("SELECT * FROM invoices LIMIT 3", (err, rows) => {
        console.log('\nSample invoices:', rows);
        
        db.all("SELECT * FROM vendors LIMIT 3", (err, rows) => {
          console.log('\nSample vendors:', rows);
          db.close();
        });
      });
    });
  });
});