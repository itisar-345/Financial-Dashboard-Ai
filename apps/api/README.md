# Financial Dashboard Backend

SQLite-based backend API for Financial Dashboard with invoice data ingestion, RESTful endpoints, and AI-powered chat functionality.

## Files Overview

- `ingest_data_sqlite.py` - Data ingestion script (JSON → SQLite)
- `server_sqlite.js` - Main Express.js API server
- `vanna_service.py` - AI chat service (optional)
- `clean_duplicates.js` - Database cleanup utility
- `check_data.js` - Database verification script
- `requirements.txt` - Python dependencies
- `package.json` - Node.js dependencies
- `.env` - Environment configuration

## Quick Start

### 1. Install Dependencies
```bash
# Python dependencies
pip install -r requirements.txt

# Node.js dependencies
npm install
```

### 2. Configure Environment
```bash
# Copy and edit .env file
PORT=3001
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Setup Database
```bash
# Import JSON data into SQLite
python ingest_data_sqlite.py

# Verify data import
node check_data.js

# Clean duplicates (if needed)
node clean_duplicates.js
```

### 4. Start Server
```bash
# Start main API server
node server_sqlite.js

# Server runs on http://localhost:3001
```

## API Endpoints

### Dashboard Data
- `GET /api/stats` - Overview card statistics
- `GET /api/invoice-trends` - Monthly invoice volume/value
- `GET /api/vendors/top10` - Top 10 vendors by spend
- `GET /api/category-spend` - Spend by category breakdown
- `GET /api/cash-outflow` - Cash outflow forecast
- `GET /api/invoices` - Searchable invoice list

### AI Chat
- `POST /api/chat-with-data` - Natural language queries

### Health Check
- `GET /health` - Server status

## Execution Sequence

**Required Order:**
1. `pip install -r requirements.txt`
2. `npm install` 
3. `python ingest_data_sqlite.py`
4. `node server_sqlite.js`

**Optional:**
- `node check_data.js` (verify data)
- `node clean_duplicates.js` (remove duplicates)
- `python vanna_service.py` (AI service)

## Database Schema

**Tables Created:**
- `documents` - PDF document metadata
- `invoices` - Main invoice data
- `vendors` - Vendor information
- `customers` - Customer details
- `payment_terms` - Payment conditions
- `line_items` - Invoice line items

## Troubleshooting

**Database Issues:**
```bash
# Check if data imported correctly
node check_data.js

# Remove duplicate records
node clean_duplicates.js
```

**Server Issues:**
```bash
# Check server health
curl http://localhost:3001/health

# Test API endpoint
curl http://localhost:3001/api/stats
```

**AI Chat Issues:**
- Ensure GROQ_API_KEY is set in .env
- Check if Groq API is accessible
- Verify natural language queries work