#!/usr/bin/env python3
"""
ASSETFLOW ENTERPRISE ERP - LOCAL SQL DATABASE INSPECTOR & QUERY STUDIO
Self-contained embedded database engine & web inspector for testing relational schemas locally.
Runs on http://localhost:8080 without requiring Docker or external PostgreSQL installation.
"""

import sqlite3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import sys
import os

DB_PATH = "assetflow_local.db"

def setup_local_database():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # 1. Departments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        department_id VARCHAR(50) PRIMARY KEY,
        department_name VARCHAR(100) NOT NULL,
        parent_id VARCHAR(50),
        manager_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Active',
        FOREIGN KEY (parent_id) REFERENCES departments(department_id)
    );
    """)
    
    # 2. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Employee',
        department_id VARCHAR(50) REFERENCES departments(department_id),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 3. Asset Categories Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS asset_categories (
        category_id VARCHAR(50) PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL,
        default_warranty_months INTEGER DEFAULT 24,
        custom_fields_schema TEXT,
        status VARCHAR(20) DEFAULT 'Active'
    );
    """)
    
    # 4. Master Assets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        asset_id VARCHAR(50) PRIMARY KEY,
        asset_tag VARCHAR(50) UNIQUE NOT NULL,
        asset_name VARCHAR(200) NOT NULL,
        category_id VARCHAR(50) REFERENCES asset_categories(category_id),
        condition_status VARCHAR(50) DEFAULT 'Good',
        location VARCHAR(100),
        department_id VARCHAR(50) REFERENCES departments(department_id),
        lifecycle_status VARCHAR(50) DEFAULT 'Available',
        serial_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 5. Asset Allocations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS asset_allocations (
        allocation_id VARCHAR(50) PRIMARY KEY,
        asset_id VARCHAR(50) REFERENCES assets(asset_id),
        user_id VARCHAR(50) REFERENCES users(user_id),
        allocated_by VARCHAR(100),
        allocation_date DATE NOT NULL,
        expected_return_date DATE,
        actual_return_date DATE,
        return_condition VARCHAR(50),
        notes TEXT
    );
    """)
    
    # 6. Transfer Requests Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transfer_requests (
        transfer_id VARCHAR(50) PRIMARY KEY,
        asset_id VARCHAR(50) REFERENCES assets(asset_id),
        current_holder_id VARCHAR(50) REFERENCES users(user_id),
        requested_by_id VARCHAR(50) REFERENCES users(user_id),
        transfer_reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        request_date DATE
    );
    """)
    
    # 7. Resource Bookings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resource_bookings (
        booking_id VARCHAR(50) PRIMARY KEY,
        resource_name VARCHAR(100) NOT NULL,
        user_id VARCHAR(50) REFERENCES users(user_id),
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        purpose VARCHAR(200),
        status VARCHAR(50) DEFAULT 'confirmed'
    );
    """)
    
    # 8. Maintenance Requests Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS maintenance_requests (
        request_id VARCHAR(50) PRIMARY KEY,
        asset_id VARCHAR(50) REFERENCES assets(asset_id),
        requested_by VARCHAR(100),
        priority_level VARCHAR(20) DEFAULT 'medium',
        issue_title VARCHAR(200) NOT NULL,
        detailed_description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        estimated_cost DECIMAL(10, 2),
        actual_cost DECIMAL(10, 2),
        created_at DATE
    );
    """)
    
    # 9. Audit Cycles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_cycles (
        cycle_id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        department_scope VARCHAR(100),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'In-Progress'
    );
    """)
    
    # 10. Audit Records Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_records (
        record_id VARCHAR(50) PRIMARY KEY,
        cycle_id VARCHAR(50) REFERENCES audit_cycles(cycle_id),
        asset_id VARCHAR(50) REFERENCES assets(asset_id),
        baseline_status VARCHAR(50),
        verification_status VARCHAR(50) DEFAULT 'Pending',
        auditor_notes TEXT
    );
    """)
    
    # 11. Activity Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        log_id VARCHAR(50) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_name VARCHAR(100),
        module_name VARCHAR(50),
        action_description TEXT,
        ip_address VARCHAR(50) DEFAULT '127.0.0.1'
    );
    """)
    
    # 12. Notifications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        notification_id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # =========================================================================
    # Pre-Seed Realistic Enterprise Production Data (40+ Assets, 20 Users)
    # =========================================================================
    seed_file = os.path.join("sql", "005_enterprise_production_data.sql")
    if os.path.exists(seed_file):
        with open(seed_file, "r", encoding="utf-8") as f:
            cursor.executescript(f.read())
        print(f"[OK] Executed enterprise production seed from '{seed_file}'.")
    else:
        print(f"[WARN] Seed file '{seed_file}' not found.")

    conn.commit()
    conn.close()
    print("[OK] Local Database initialized and pre-seeded at 'assetflow_local.db'.")

# =============================================================================
# WEB-BASED DATABASE INSPECTOR SERVER (ZERO API REQUIREMENT)
# =============================================================================
class DatabaseInspectorHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        
        if path == "/api/tables":
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
            tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            self.send_json({"tables": tables})
            
        elif path == "/api/query":
            sql = query.get("sql", ["SELECT * FROM assets;"])[0]
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            try:
                cursor.execute(sql)
                columns = [description[0] for description in cursor.description] if cursor.description else []
                rows = cursor.fetchall()
                if sql.strip().upper().startswith(("INSERT", "UPDATE", "DELETE")):
                    conn.commit()
                conn.close()
                self.send_json({"columns": columns, "rows": rows, "status": "success"})
            except Exception as e:
                conn.close()
                self.send_json({"status": "error", "message": str(e)})
                
        else:
            self.send_html_dashboard()

    def send_json(self, data):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def send_html_dashboard(self):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AssetFlow Local Database Studio (Zero-API Inspection)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #0f172a; color: #f8fafc; }
        header { background: #1e293b; padding: 18px 28px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.4rem; font-weight: 800; color: #6366f1; display: flex; align-items: center; gap: 10px; }
        .container { display: flex; height: calc(100vh - 66px); }
        .sidebar { width: 240px; background: #1e293b; border-right: 1px solid #334155; padding: 16px 12px; overflow-y: auto; }
        .table-btn { display: block; width: 100%; text-align: left; padding: 10px 14px; background: transparent; border: none; color: #cbd5e1; font-weight: 500; border-radius: 6px; cursor: pointer; transition: 0.15s; font-size: 0.92rem; margin-bottom: 4px; }
        .table-btn:hover, .table-btn.active { background: #6366f1; color: white; }
        .main { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
        h3 { margin-top: 0; font-size: 1.2rem; color: #38bdf8; }
        textarea { width: 100%; background: #0f172a; border: 1px solid #475569; color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.95rem; resize: vertical; box-sizing: border-box; }
        button.run-btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 10px; font-size: 0.95rem; }
        button.run-btn:hover { background: #059669; }
        .table-wrap { overflow-x: auto; max-height: 500px; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
        th { background: #0f172a; padding: 12px 14px; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; border-bottom: 2px solid #334155; position: sticky; top: 0; }
        td { padding: 12px 14px; border-bottom: 1px solid #334155; color: #e2e8f0; }
        tr:hover td { background: rgba(255, 255, 255, 0.04); }
        .badge { background: rgba(99, 102, 241, 0.2); color: #818cf8; padding: 4px 8px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
    </style>
</head>
<body>
    <header>
        <div class="logo">⚡ AssetFlow Database Studio <span class="badge">Pure SQL Engine (`assetflow_local.db`)</span></div>
        <div style="font-size: 0.85rem; color: #94a3b8;">No API Server Required &bull; Direct Database Inspection & Querying</div>
    </header>
    <div class="container">
        <aside class="sidebar">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; padding: 8px 12px;">Database Tables</div>
            <div id="table-list">Loading...</div>
        </aside>
        <main class="main">
            <div class="card">
                <h3>Direct SQL Query Studio</h3>
                <textarea id="sql-input" rows="3">SELECT * FROM assets;</textarea>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="run-btn" onclick="runQuery()">Run SQL Query</button>
                    <button class="run-btn" style="background:#6366f1;" onclick="loadTable('asset_allocations')">Check Allocations</button>
                    <button class="run-btn" style="background:#8b5cf6;" onclick="loadTable('resource_bookings')">Check Bookings</button>
                    <button class="run-btn" style="background:#f59e0b;" onclick="loadTable('maintenance_requests')">Check Repairs</button>
                </div>
            </div>
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                    <h3 id="current-title" style="margin: 0;">Table: assets</h3>
                    <span id="row-count" class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">0 Rows</span>
                </div>
                <div class="table-wrap">
                    <table id="result-table">
                        <thead><tr id="table-head"></tr></thead>
                        <tbody id="table-body"></tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
    <script>
        async function fetchTables() {
            const res = await fetch('/api/tables');
            const data = await res.json();
            const list = document.getElementById('table-list');
            list.innerHTML = data.tables.map(t => `<button class="table-btn" onclick="loadTable('${t}')">${t}</button>`).join('');
            loadTable('assets');
        }

        async function loadTable(tableName) {
            document.querySelectorAll('.table-btn').forEach(b => b.classList.remove('active'));
            const btn = Array.from(document.querySelectorAll('.table-btn')).find(b => b.textContent === tableName);
            if (btn) btn.classList.add('active');
            
            document.getElementById('sql-input').value = `SELECT * FROM ${tableName};`;
            document.getElementById('current-title').textContent = `Table: ${tableName}`;
            runQuery();
        }

        async function runQuery() {
            const sql = document.getElementById('sql-input').value;
            const res = await fetch(`/api/query?sql=${encodeURIComponent(sql)}`);
            const data = await res.json();
            
            if (data.status === 'error') {
                alert(`SQL Error: ${data.message}`);
                return;
            }
            
            document.getElementById('row-count').textContent = `${data.rows.length} Rows`;
            const head = document.getElementById('table-head');
            const body = document.getElementById('table-body');
            
            head.innerHTML = data.columns.map(c => `<th>${c}</th>`).join('');
            body.innerHTML = data.rows.map(r => `<tr>${r.map(v => `<td>${v !== null ? v : '<i style="color:#64748b;">NULL</i>'}</td>`).join('')}</tr>`).join('');
        }

        window.onload = fetchTables;
    </script>
</body>
</html>"""
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

if __name__ == "__main__":
    setup_local_database()
    port = 8080
    server = HTTPServer(("localhost", port), DatabaseInspectorHandler)
    print(f"\n[READY] AssetFlow Local SQL Inspector & Database Studio running on http://localhost:{port}")
    print("[INFO] Press CTRL+C to stop the database server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[OK] Database server stopped.")
        sys.exit(0)
