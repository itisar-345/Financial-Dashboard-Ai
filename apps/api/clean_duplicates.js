const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./financial_dashboard.db');

// Remove duplicate invoices keeping only one per invoice_id
db.run(`
  DELETE FROM invoices 
  WHERE rowid NOT IN (
    SELECT MIN(rowid) 
    FROM invoices 
    GROUP BY invoice_id
  )
`, (err) => {
  if (err) {
    console.error('Error cleaning duplicates:', err);
  } else {
    console.log('Duplicate invoices by invoice_id removed successfully');
  }
  db.close();
});