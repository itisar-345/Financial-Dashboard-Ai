import os
import sqlite3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import vanna as vn
from vanna.remote import VannaDefault

app = Flask(__name__)
CORS(app)

# Initialize Vanna
vn = VannaDefault(model='chinook', api_key='demo-key')

# Connect to SQLite database
DB_PATH = './financial_dashboard.db'

def setup_vanna():
    """Setup Vanna with database connection"""
    vn.connect_to_sqlite(DB_PATH)

@app.route('/generate-sql', methods=['POST'])
def generate_sql():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        # Generate SQL using Vanna
        sql = vn.generate_sql(question=query)
        
        # Execute SQL on SQLite database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(sql)
        rows = cursor.fetchall()
        
        # Convert to list of dictionaries
        results = [dict(row) for row in rows]
        
        conn.close()
        
        return jsonify({
            'sql': sql,
            'results': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    setup_vanna()
    app.run(host='0.0.0.0', port=5000, debug=True)