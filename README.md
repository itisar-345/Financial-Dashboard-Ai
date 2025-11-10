# Financial Dashboard AI - Monorepo

AI-powered Financial Dashboard with Invoice Processing, Chat Interface, and Analytics.

## Structure

```
Financial-Dashboard-Ai/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Node.js backend
├── services/
│   └── vanna/        # AI service for natural language queries
├── data/
│   └── Analytics_Test_Data.json  # Sample financial data
└── package.json      # Root workspace
```

## Quick Start

```bash
# Install all dependencies
npm install

# Setup database
npm run setup

# Start both frontend and backend
npm run dev
```

## Individual Commands

```bash
# Frontend only
npm run dev:web

# Backend only  
npm run dev:api

# Build frontend
npm run build
```

## Features

- **Dashboard**: Overview cards, charts, invoice table
- **Chat with Data**: AI-powered natural language queries
- **Data Ingestion**: JSON to SQLite conversion
- **REST API**: Complete backend endpoints
- **Monorepo**: Organized workspace structure
