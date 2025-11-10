# Financial Dashboard AI - Documentation

## Setup Steps

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- npm

### Installation & Setup
```bash
# Clone and navigate to project
cd Financial-Dashboard-Ai

# Install all dependencies
npm install

# Setup database (ingest data + clean duplicates)
npm run setup

# Start both frontend and backend
npm run dev
```

### Individual Commands
```bash
# Frontend only (React - port 3000)
npm run dev:web

# Backend only (Node.js - port 5000)
npm run dev:api

# Data ingestion only
npm run ingest

# Check database data
npm run check
```

### Environment Variables
No environment variables required for basic setup. Default configurations:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Database: `financial_dashboard.db` (SQLite)

## Database Schema Overview

### Core Tables Structure
```
organizations
├── id (TEXT, PK)
├── name (TEXT)
└── created_at (TIMESTAMP)

departments
├── id (TEXT, PK)
├── organization_id (TEXT, FK → organizations.id)
├── name (TEXT)
└── created_at (TIMESTAMP)

users
├── id (TEXT, PK)
├── email (TEXT, UNIQUE)
├── name (TEXT)
└── created_at (TIMESTAMP)

documents
├── id (TEXT, PK)
├── name (TEXT)
├── file_path (TEXT)
├── file_size (INTEGER)
├── file_type (TEXT)
├── status (TEXT)
├── organization_id (TEXT, FK → organizations.id)
├── department_id (TEXT, FK → departments.id)
├── uploaded_by_id (TEXT, FK → users.id)
├── is_validated_by_human (BOOLEAN)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── processed_at (TIMESTAMP)
└── analytics_id (TEXT)

vendors
├── id (INTEGER, PK, AUTOINCREMENT)
├── name (TEXT)
├── address (TEXT)
├── tax_id (TEXT)
├── party_number (TEXT)
└── created_at (TIMESTAMP)

customers
├── id (INTEGER, PK, AUTOINCREMENT)
├── name (TEXT)
├── address (TEXT)
├── tax_id (TEXT)
└── created_at (TIMESTAMP)

invoices
├── id (INTEGER, PK, AUTOINCREMENT)
├── document_id (TEXT, FK → documents.id)
├── invoice_id (TEXT)
├── invoice_date (DATE)
├── delivery_date (DATE)
├── vendor_id (INTEGER, FK → vendors.id)
├── customer_id (INTEGER, FK → customers.id)
├── document_type (TEXT)
├── currency_symbol (TEXT)
├── sub_total (DECIMAL)
├── total_tax (DECIMAL)
├── invoice_total (DECIMAL)
└── created_at (TIMESTAMP)

line_items
├── id (INTEGER, PK, AUTOINCREMENT)
├── invoice_id (INTEGER, FK → invoices.id)
├── sr_no (INTEGER)
├── description (TEXT)
├── quantity (DECIMAL)
├── unit_price (DECIMAL)
├── total_price (DECIMAL)
├── sachkonto (TEXT)
├── bu_schluessel (TEXT)
├── vat_rate (DECIMAL)
├── vat_amount (DECIMAL)
└── created_at (TIMESTAMP)

payment_terms
├── id (INTEGER, PK, AUTOINCREMENT)
├── invoice_id (INTEGER, FK → invoices.id)
├── due_date (DATE)
├── payment_terms (TEXT)
├── bank_account_number (TEXT)
├── bic (TEXT)
├── account_name (TEXT)
├── net_days (INTEGER)
├── discount_percentage (DECIMAL)
├── discount_days (INTEGER)
├── discount_due_date (DATE)
├── discounted_total (DECIMAL)
└── created_at (TIMESTAMP)
```

## API Documentation

### Base URL: `http://localhost:5000`

### Routes

#### 1. Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Dashboard Overview
```
GET /api/dashboard
```
**Response:**
```json
{
  "totalInvoices": 150,
  "totalRevenue": 125000.50,
  "totalVendors": 25,
  "avgInvoiceAmount": 833.34,
  "recentInvoices": [
    {
      "id": 1,
      "invoice_id": "INV-2024-001",
      "vendor_name": "Tech Solutions Ltd",
      "invoice_total": 1500.00,
      "invoice_date": "2024-01-15",
      "status": "processed"
    }
  ]
}
```

#### 3. Get All Invoices
```
GET /api/invoices
```
**Response:**
```json
{
  "invoices": [
    {
      "id": 1,
      "invoice_id": "INV-2024-001",
      "vendor_name": "Tech Solutions Ltd",
      "customer_name": "ABC Corp",
      "invoice_date": "2024-01-15",
      "delivery_date": "2024-01-10",
      "sub_total": 1200.00,
      "total_tax": 300.00,
      "invoice_total": 1500.00,
      "currency_symbol": "€",
      "document_type": "Invoice"
    }
  ]
}
```

#### 4. Get Invoice by ID
```
GET /api/invoices/:id
```
**Response:**
```json
{
  "invoice": {
    "id": 1,
    "invoice_id": "INV-2024-001",
    "vendor_name": "Tech Solutions Ltd",
    "invoice_total": 1500.00,
    "line_items": [
      {
        "description": "Software License",
        "quantity": 1,
        "unit_price": 1200.00,
        "total_price": 1200.00,
        "vat_rate": 25.00
      }
    ]
  }
}
```

#### 5. Get Vendors
```
GET /api/vendors
```
**Response:**
```json
{
  "vendors": [
    {
      "id": 1,
      "name": "Tech Solutions Ltd",
      "address": "123 Tech Street, Berlin",
      "tax_id": "DE123456789",
      "total_invoices": 5,
      "total_amount": 7500.00
    }
  ]
}
```

#### 6. Chat with Data (Natural Language Query)
```
POST /api/chat
Content-Type: application/json

{
  "query": "Show me monthly revenue trends for the last 6 months"
}
```
**Response:**
```json
{
  "sql": "SELECT strftime('%Y-%m', invoice_date) as month, SUM(invoice_total) as revenue FROM invoices WHERE invoice_date >= date('now', '-6 months') GROUP BY month ORDER BY month",
  "data": [
    {"month": "2023-08", "revenue": 15000.00},
    {"month": "2023-09", "revenue": 18500.00},
    {"month": "2023-10", "revenue": 22000.00}
  ],
  "chart_type": "line",
  "explanation": "Monthly revenue showing upward trend over 6 months"
}
```

#### 7. Get Analytics Data
```
GET /api/analytics/revenue-by-month
```
**Response:**
```json
{
  "data": [
    {"month": "2024-01", "revenue": 25000.00},
    {"month": "2024-02", "revenue": 28000.00}
  ]
}
```

## "Chat with Data" Workflow

### Complete Flow: Frontend → API → Vanna → SQL → DB → Result

```
1. USER INPUT
   ├── User types: "What are our top 5 vendors by revenue?"
   └── Frontend sends POST /api/chat

2. API PROCESSING
   ├── Receives natural language query
   ├── Validates input
   └── Forwards to Vanna AI service

3. VANNA AI SERVICE
   ├── Analyzes database schema
   ├── Converts natural language to SQL
   ├── Returns: "SELECT v.name, SUM(i.invoice_total) as total 
   │            FROM vendors v JOIN invoices i ON v.id = i.vendor_id 
   │            GROUP BY v.id ORDER BY total DESC LIMIT 5"
   └── Sends back to API

4. SQL EXECUTION
   ├── API executes generated SQL on SQLite database
   ├── Database returns query results
   └── API formats response

5. RESULT PROCESSING
   ├── API determines appropriate chart type (bar, line, pie)
   ├── Structures data for frontend consumption
   └── Returns JSON response

6. FRONTEND RENDERING
   ├── Receives structured data
   ├── Renders interactive chart (Chart.js/Recharts)
   ├── Shows SQL query (optional)
   └── Displays results to user
```

### Technical Implementation

**Frontend (React):**
```javascript
// Chat component sends query
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: userInput })
});
```

**Backend (Node.js/Express):**
```javascript
// API processes and executes
app.post('/api/chat', async (req, res) => {
  const { query } = req.body;
  const sql = await vannaService.generateSQL(query);
  const data = await db.execute(sql);
  res.json({ sql, data, chart_type: 'auto' });
});
```

**Database Integration:**
- SQLite database with financial schema
- Optimized queries for dashboard analytics
- Foreign key relationships maintained
- Automatic duplicate cleaning on data ingestion

This workflow enables users to ask business questions in plain English and receive immediate visual insights from their financial data.