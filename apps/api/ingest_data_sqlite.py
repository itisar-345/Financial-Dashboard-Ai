#!/usr/bin/env python3
"""
SQLite version of data ingestion script
"""

import json
import sqlite3
from datetime import datetime
from decimal import Decimal

class SQLiteIngester:
    def __init__(self, db_path="financial_dashboard.db"):
        self.db_path = db_path
        self.conn = None
        
    def connect(self):
        self.conn = sqlite3.connect(self.db_path)
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.create_tables()
        print(f"Connected to SQLite database: {self.db_path}")
    
    def create_tables(self):
        """Create all tables"""
        cursor = self.conn.cursor()
        
        # Organizations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Departments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id TEXT PRIMARY KEY,
                organization_id TEXT REFERENCES organizations(id),
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Vendors
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                tax_id TEXT,
                party_number TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Customers
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                tax_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Documents
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                file_path TEXT,
                file_size INTEGER,
                file_type TEXT,
                status TEXT,
                organization_id TEXT REFERENCES organizations(id),
                department_id TEXT REFERENCES departments(id),
                uploaded_by_id TEXT REFERENCES users(id),
                is_validated_by_human BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                processed_at TIMESTAMP,
                analytics_id TEXT
            )
        """)
        
        # Invoices
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id TEXT REFERENCES documents(id),
                invoice_id TEXT,
                invoice_date DATE,
                delivery_date DATE,
                vendor_id INTEGER REFERENCES vendors(id),
                customer_id INTEGER REFERENCES customers(id),
                document_type TEXT,
                currency_symbol TEXT,
                sub_total DECIMAL(15,2),
                total_tax DECIMAL(15,2),
                invoice_total DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Payment terms
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_terms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER REFERENCES invoices(id),
                due_date DATE,
                payment_terms TEXT,
                bank_account_number TEXT,
                bic TEXT,
                account_name TEXT,
                net_days INTEGER,
                discount_percentage DECIMAL(5,2),
                discount_days INTEGER,
                discount_due_date DATE,
                discounted_total DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Line items
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS line_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER REFERENCES invoices(id),
                sr_no INTEGER,
                description TEXT,
                quantity DECIMAL(10,3),
                unit_price DECIMAL(15,2),
                total_price DECIMAL(15,2),
                sachkonto TEXT,
                bu_schluessel TEXT,
                vat_rate DECIMAL(5,2),
                vat_amount DECIMAL(15,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.conn.commit()
    
    def parse_date(self, date_str):
        if not date_str or date_str == "":
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except:
            return None
    
    def parse_datetime(self, datetime_obj):
        if not datetime_obj:
            return None
        if isinstance(datetime_obj, dict) and "$date" in datetime_obj:
            return datetime.fromisoformat(datetime_obj["$date"].replace("Z", "+00:00"))
        return None
    
    def safe_decimal(self, value):
        if value is None or value == "":
            return None
        try:
            return float(value)
        except:
            return None
    
    def ingest_data(self, json_file_path):
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        cursor = self.conn.cursor()
        
        for doc in data:
            try:
                # Insert organizations, departments, users
                if doc.get("organizationId"):
                    cursor.execute(
                        "INSERT OR IGNORE INTO organizations (id, name) VALUES (?, ?)",
                        (doc["organizationId"], f"Organization {doc['organizationId']}")
                    )
                
                if doc.get("departmentId") and doc.get("organizationId"):
                    cursor.execute(
                        "INSERT OR IGNORE INTO departments (id, organization_id, name) VALUES (?, ?, ?)",
                        (doc["departmentId"], doc["organizationId"], f"Department {doc['departmentId']}")
                    )
                
                if doc.get("uploadedById"):
                    cursor.execute(
                        "INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)",
                        (doc["uploadedById"], f"User {doc['uploadedById']}")
                    )
                
                # Insert document
                cursor.execute("""
                    INSERT OR IGNORE INTO documents (
                        id, name, file_path, file_size, file_type, status,
                        organization_id, department_id, uploaded_by_id,
                        is_validated_by_human, created_at, updated_at,
                        processed_at, analytics_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    doc["_id"], doc["name"], doc.get("filePath"),
                    int(doc.get("fileSize", {}).get("$numberLong", 0)),
                    doc.get("fileType"), doc.get("status"),
                    doc.get("organizationId"), doc.get("departmentId"),
                    doc.get("uploadedById"), doc.get("isValidatedByHuman", False),
                    self.parse_datetime(doc.get("createdAt")),
                    self.parse_datetime(doc.get("updatedAt")),
                    self.parse_datetime(doc.get("processedAt")),
                    doc.get("analyticsId")
                ))
                
                # Extract and insert vendor/customer data
                extracted_data = doc.get("extractedData", {}).get("llmData", {})
                
                vendor_id = None
                if "vendor" in extracted_data and extracted_data["vendor"].get("value"):
                    vendor = extracted_data["vendor"]["value"]
                    name = vendor.get("vendorName", {}).get("value", "Unknown Vendor")
                    address = vendor.get("vendorAddress", {}).get("value")
                    tax_id = vendor.get("vendorTaxId", {}).get("value")
                    party_number = vendor.get("vendorPartyNumber", {}).get("value")
                    
                    cursor.execute("""
                        INSERT INTO vendors (name, address, tax_id, party_number)
                        VALUES (?, ?, ?, ?)
                    """, (name, address, tax_id, party_number))
                    vendor_id = cursor.lastrowid
                
                customer_id = None
                if "customer" in extracted_data and extracted_data["customer"].get("value"):
                    customer = extracted_data["customer"]["value"]
                    name = customer.get("customerName", {}).get("value")
                    if name:
                        address = customer.get("customerAddress", {}).get("value")
                        tax_id = customer.get("customerTaxId")
                        
                        cursor.execute("""
                            INSERT INTO customers (name, address, tax_id)
                            VALUES (?, ?, ?)
                        """, (name, address, tax_id))
                        customer_id = cursor.lastrowid
                
                # Insert invoice
                invoice_data = extracted_data.get("invoice", {}).get("value", {})
                summary_data = extracted_data.get("summary", {}).get("value", {})
                
                invoice_id_val = invoice_data.get("invoiceId", {}).get("value")
                invoice_date = self.parse_date(invoice_data.get("invoiceDate", {}).get("value"))
                delivery_date = self.parse_date(invoice_data.get("deliveryDate", {}).get("value"))
                
                document_type = summary_data.get("documentType", {}).get("value") if isinstance(summary_data.get("documentType"), dict) else summary_data.get("documentType")
                currency_symbol = summary_data.get("currencySymbol", {}).get("value") if isinstance(summary_data.get("currencySymbol"), dict) else summary_data.get("currencySymbol")
                
                sub_total = self.safe_decimal(summary_data.get("subTotal", {}).get("value"))
                total_tax = self.safe_decimal(summary_data.get("totalTax", {}).get("value"))
                invoice_total = self.safe_decimal(summary_data.get("invoiceTotal", {}).get("value"))
                
                cursor.execute("""
                    INSERT INTO invoices (
                        document_id, invoice_id, invoice_date, delivery_date,
                        vendor_id, customer_id, document_type, currency_symbol,
                        sub_total, total_tax, invoice_total
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    doc["_id"], invoice_id_val, invoice_date, delivery_date,
                    vendor_id, customer_id, document_type, currency_symbol,
                    sub_total, total_tax, invoice_total
                ))
                
                invoice_db_id = cursor.lastrowid
                
                # Insert line items
                line_items_data = extracted_data.get("lineItems", {}).get("value", {})
                if line_items_data and "items" in line_items_data:
                    items = line_items_data["items"].get("value", [])
                    
                    for item in items:
                        sr_no = item.get("srNo", {}).get("value") if isinstance(item.get("srNo"), dict) else item.get("srNo")
                        description = item.get("description", {}).get("value") if isinstance(item.get("description"), dict) else item.get("description")
                        quantity = self.safe_decimal(item.get("quantity", {}).get("value") if isinstance(item.get("quantity"), dict) else item.get("quantity"))
                        unit_price = self.safe_decimal(item.get("unitPrice", {}).get("value") if isinstance(item.get("unitPrice"), dict) else item.get("unitPrice"))
                        total_price = self.safe_decimal(item.get("totalPrice", {}).get("value") if isinstance(item.get("totalPrice"), dict) else item.get("totalPrice"))
                        sachkonto = item.get("Sachkonto", {}).get("value") if isinstance(item.get("Sachkonto"), dict) else item.get("Sachkonto")
                        bu_schluessel = item.get("BUSchluessel", {}).get("value") if isinstance(item.get("BUSchluessel"), dict) else item.get("BUSchluessel")
                        vat_rate = self.safe_decimal(item.get("vatRate", {}).get("value") if isinstance(item.get("vatRate"), dict) else item.get("vatRate"))
                        vat_amount = self.safe_decimal(item.get("vatAmount", {}).get("value") if isinstance(item.get("vatAmount"), dict) else item.get("vatAmount"))
                        
                        cursor.execute("""
                            INSERT INTO line_items (
                                invoice_id, sr_no, description, quantity, unit_price,
                                total_price, sachkonto, bu_schluessel, vat_rate, vat_amount
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            invoice_db_id, sr_no, description, quantity, unit_price,
                            total_price, sachkonto, bu_schluessel, vat_rate, vat_amount
                        ))
                
                print(f"Processed document: {doc['_id']}")
                
            except Exception as e:
                print(f"Error processing document {doc.get('_id', 'unknown')}: {e}")
                continue
        
        self.conn.commit()
        print("Data ingestion completed successfully")
    
    def close(self):
        if self.conn:
            self.conn.close()

if __name__ == "__main__":
    ingester = SQLiteIngester()
    try:
        ingester.connect()
        ingester.ingest_data("../src/assets/Analytics_Test_Data.json")
    finally:
        ingester.close()