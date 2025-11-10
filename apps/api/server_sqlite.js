const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const sqlite3 = require('sqlite3').verbose();

require('dotenv').config();

if (!process.env.GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY not set in .env file');
}

const app = express();
const PORT = process.env.PORT || 3001;



// Database connection
const db = new sqlite3.Database('./financial_dashboard.db');

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
  db.get(`
    SELECT 
      COUNT(DISTINCT invoice_id) as totalInvoices,
      SUM(invoice_total) as totalSpend,
      AVG(invoice_total) as avgInvoiceValue,
      (SELECT COUNT(DISTINCT id) FROM documents) as documentsUploaded
    FROM invoices 
    WHERE invoice_total IS NOT NULL
  `, (err, row) => {
    if (err) {
      console.error('Error fetching stats:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(row);
  });
});

// Invoice trends endpoint
app.get('/api/invoice-trends', (req, res) => {
  db.all(`
    SELECT 
      strftime('%Y-%m', invoice_date) as month,
      SUM(invoice_total) as value,
      COUNT(DISTINCT invoice_id) as count
    FROM invoices 
    WHERE invoice_date IS NOT NULL AND invoice_total IS NOT NULL
    GROUP BY strftime('%Y-%m', invoice_date)
    ORDER BY month DESC
    LIMIT 12
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching invoice trends:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});

// Top 10 vendors endpoint
app.get('/api/vendors/top10', (req, res) => {
  db.all(`
    SELECT 
      v.name as vendor,
      SUM(i.invoice_total) as spend
    FROM vendors v
    JOIN invoices i ON v.id = i.vendor_id
    WHERE i.invoice_total IS NOT NULL
    GROUP BY v.id, v.name
    ORDER BY spend DESC
    LIMIT 10
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching top vendors:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});

// Category spend endpoint
app.get('/api/category-spend', (req, res) => {
  db.all(`
    SELECT 
      CASE 
        WHEN v.name LIKE '%Tech%' OR v.name LIKE '%Software%' THEN 'Technology'
        WHEN v.name LIKE '%Office%' OR v.name LIKE '%Supply%' THEN 'Office Supplies'
        WHEN v.name LIKE '%Travel%' THEN 'Travel'
        ELSE 'Other'
      END as category,
      SUM(i.invoice_total) as spend
    FROM invoices i
    JOIN vendors v ON i.vendor_id = v.id
    WHERE i.invoice_total IS NOT NULL
    GROUP BY category
    ORDER BY spend DESC
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching category spend:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});

// Cash outflow endpoint
app.get('/api/cash-outflow', (req, res) => {
  db.all(`
    SELECT 
      strftime('%Y-%m', 
        COALESCE(pt.due_date, date(i.invoice_date, '+30 days'))
      ) as month,
      SUM(i.invoice_total) as amount
    FROM invoices i
    LEFT JOIN payment_terms pt ON i.id = pt.invoice_id
    WHERE i.invoice_total IS NOT NULL
    GROUP BY strftime('%Y-%m', 
      COALESCE(pt.due_date, date(i.invoice_date, '+30 days'))
    )
    ORDER BY month
    LIMIT 12
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching cash outflow:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(rows);
  });
});

// Invoices endpoint
app.get('/api/invoices', (req, res) => {
  const search = req.query.search || '';
  const limit = req.query.limit || 100;
  
  let query = `
    SELECT DISTINCT
      i.id,
      i.invoice_id as invoiceNumber,
      i.invoice_date as invoiceDate,
      i.invoice_total as amount,
      i.currency_symbol as currency,
      v.name as vendor,
      CASE 
        WHEN pt.due_date < date('now') THEN 'overdue'
        WHEN pt.due_date IS NULL THEN 'pending'
        ELSE 'pending'
      END as status,
      'General' as category
    FROM invoices i
    LEFT JOIN vendors v ON i.vendor_id = v.id
    LEFT JOIN payment_terms pt ON i.id = pt.invoice_id
    WHERE 1=1
  `;
  
  const params = [];
  if (search) {
    query += ` AND (v.name LIKE ? OR i.invoice_id LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY i.invoice_date DESC LIMIT ?`;
  params.push(limit);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching invoices:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});



// Chat with data endpoint
app.post('/api/chat-with-data', (req, res) => {
  const { query } = req.body;
  
  // Generate SQL based on common queries
  let sql = '';
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('total spend') || lowerQuery.includes('total amount')) {
    sql = 'SELECT SUM(invoice_total) as total_spend FROM invoices WHERE invoice_total IS NOT NULL';
  } else if (lowerQuery.includes('top') && lowerQuery.includes('vendor')) {
    sql = 'SELECT v.name as vendor, SUM(i.invoice_total) as total_spend FROM vendors v JOIN invoices i ON v.id = i.vendor_id GROUP BY v.name ORDER BY total_spend DESC LIMIT 5';
  } else if (lowerQuery.includes('overdue')) {
    sql = 'SELECT DISTINCT v.name as vendor, i.invoice_id, i.invoice_total FROM invoices i JOIN vendors v ON i.vendor_id = v.id JOIN payment_terms pt ON i.id = pt.invoice_id WHERE pt.due_date < date("now")';
  } else if (lowerQuery.includes('count') || lowerQuery.includes('number')) {
    sql = 'SELECT COUNT(DISTINCT id) as total_invoices FROM invoices';
  } else {
    sql = 'SELECT DISTINCT v.name as vendor, i.invoice_total as amount, i.invoice_date FROM invoices i JOIN vendors v ON i.vendor_id = v.id ORDER BY i.invoice_date DESC LIMIT 10';
  }
  
  // Execute SQL
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.json({ 
        sql: sql,
        results: [],
        error: 'Query execution failed'
      });
    }
    
    res.json({ sql: sql, results: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});