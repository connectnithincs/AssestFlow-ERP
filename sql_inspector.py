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
    # Pre-Seed Realistic Sample Data (Exact Hackathon 10-Screen Demo Data)
    # =========================================================================
    
    # Departments
    cursor.executemany("INSERT INTO departments VALUES (?, ?, ?, ?, ?);", [
        ("CORP-HQ", "Executive Headquarters", None, "Sriram Admin", "Active"),
        ("IT-GLOBAL", "Global IT & Cloud Infrastructure", "CORP-HQ", "Priya Sharma", "Active"),
        ("OPS-MEDIA", "Media Production & Broadcasting", "CORP-HQ", "Rajesh Kumar", "Active"),
        ("FIN-AUDIT", "Internal Audit & Compliance", "CORP-HQ", "Sriram Admin", "Active")
    ])
    
    # Users
    cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, datetime('now'));", [
        ("usr-1", "Sriram Admin", "admin@assetflow.local", "Admin", "CORP-HQ", "Active"),
        ("usr-2", "Priya Sharma", "manager@assetflow.local", "Asset Manager", "IT-GLOBAL", "Active"),
        ("usr-3", "Rajesh Kumar", "rajesh@assetflow.local", "Department Head", "OPS-MEDIA", "Active"),
        ("usr-4", "Ananya Iyer", "employee@assetflow.local", "Employee", "IT-GLOBAL", "Active"),
        ("usr-5", "Vikram Mehta", "vikram@assetflow.local", "Employee", "OPS-MEDIA", "Active")
    ])
    
    # Asset Categories
    cursor.executemany("INSERT INTO asset_categories VALUES (?, ?, ?, ?, ?);", [
        ("cat-1", "Electronics", 36, "CPU, RAM, MAC Address, SSD Storage", "Active"),
        ("cat-2", "Production Equipment", 24, "Sensor Size, Lens Mount, Firmware Version", "Active"),
        ("cat-3", "Furniture", 60, "Material, Ergonomic Rating, Load Capacity", "Active"),
        ("cat-4", "Vehicles", 36, "License Plate, Mileage, Fuel Type, Insurance Expiry", "Active")
    ])
    
    # Assets
    cursor.executemany("INSERT INTO assets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));", [
        ("ast-1", "AF-0001", "MacBook Pro M3 Max (64GB RAM)", "cat-1", "New", "Server Room A", "IT-GLOBAL", "Allocated", "SN-998822-M3"),
        ("ast-2", "AF-0002", "Sony FX6 Full-Frame Cinema Camera Kit", "cat-2", "Good", "Media Studio 1", "OPS-MEDIA", "Available", "SN-882910-FX"),
        ("ast-3", "AF-0114", "Dell XPS 15 OLED Laptop (i9/32GB)", "cat-1", "Good", "Priya Desk 4B", "IT-GLOBAL", "Allocated", "SN-331122-DELL"),
        ("ast-4", "AF-0019", "Herman Miller Aeron Ergonomic Task Chair", "cat-3", "Good", "Executive Suite 302", "CORP-HQ", "Allocated", "SN-HM-AERON"),
        ("ast-5", "AF-0088", "ARRI SkyPanel S60-C LED Softlight", "cat-2", "Fair", "Service Bay 2", "OPS-MEDIA", "Under Maintenance", "SN-ARRI-88"),
        ("ast-6", "AF-V009", "Ford Transit Custom Utility Van (4WD)", "cat-4", "Good", "Underground Garage Bay 4", "OPS-MEDIA", "Available", "SN-VAN-FORD-09"),
        ("ast-7", "AF-0044", "iPad Pro 12.9\" M2 w/ Apple Pencil", "cat-1", "Poor", "IT Depot Locker 8", "IT-GLOBAL", "Allocated", "SN-IPAD-PRO-44"),
        ("ast-8", "AF-0092", "Sennheiser MKH 416 Shotgun Mic Kit", "cat-2", "Damaged", "Audit Flagged Area", "OPS-MEDIA", "Lost", "SN-MIC-92")
    ])
    
    # Allocations
    cursor.executemany("INSERT INTO asset_allocations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", [
        ("alloc-1", "ast-1", "usr-2", "Sriram Admin", "2026-06-15", "2026-07-20", None, None, "Assigned for infrastructure deployment"),
        ("alloc-2", "ast-3", "usr-2", "Priya Sharma", "2026-06-01", "2026-08-01", None, None, "Primary workstation laptop"),
        ("alloc-3", "ast-4", "usr-1", "Sriram Admin", "2026-01-10", "2026-12-31", None, None, "Office seating"),
        ("alloc-4", "ast-7", "usr-4", "Priya Sharma", "2026-06-01", "2026-07-08", None, None, "Field tablet (OVERDUE RETURN)")
    ])
    
    # Bookings
    cursor.executemany("INSERT INTO resource_bookings VALUES (?, ?, ?, ?, ?, ?, ?);", [
        ("bk-1", "Boardroom A (4K Video Conferencing)", "usr-2", "2026-07-12 09:00:00", "2026-07-12 11:00:00", "Executive Strategy Roadmap Sync", "confirmed"),
        ("bk-2", "Utility Van Ford Transit (AF-V009)", "usr-3", "2026-07-12 13:00:00", "2026-07-12 17:00:00", "On-Location Broadcast Shoot at Stadium", "confirmed"),
        ("bk-3", "Executive Suite B2", "usr-1", "2026-07-12 14:00:00", "2026-07-12 16:00:00", "Annual IT Budget Audit Meeting", "confirmed")
    ])
    
    # Maintenance
    cursor.executemany("INSERT INTO maintenance_requests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", [
        ("mnt-1", "ast-5", "Rajesh Kumar", "high", "Power supply flickering above 80% output", "Driver ballast overheats during continuous studio recording.", "in_progress", 350.00, None, "2026-07-10"),
        ("mnt-2", "ast-7", "Ananya Iyer", "medium", "Screen digitizer unresponsive near edges", "Touch input drops out when using stylus in landscape mode.", "pending", 180.00, None, "2026-07-11")
    ])
    
    # Audit Cycles & Records
    cursor.execute("INSERT INTO audit_cycles VALUES (?, ?, ?, ?, ?, ?);", 
                   ("aud-101", "Q3 Global IT & Studio Verification Audit", "All Departments", "2026-07-01", "2026-07-15", "In-Progress"))
    
    cursor.executemany("INSERT INTO audit_records VALUES (?, ?, ?, ?, ?, ?);", [
        ("rec-1", "aud-101", "ast-1", "Allocated", "Verified", "Checked with Priya Sharma at desk."),
        ("rec-2", "aud-101", "ast-2", "Available", "Verified", "Serial SN-882910 verified in Studio 1."),
        ("rec-3", "aud-101", "ast-3", "Allocated", "Verified", "All good."),
        ("rec-4", "aud-101", "ast-8", "Available", "Missing", "Not found in sound locker 3. Flagged.")
    ])
    
    # Logs
    cursor.executemany("INSERT INTO activity_logs VALUES (?, datetime('now'), ?, ?, ?, ?);", [
        ("log-1", "Sriram Admin", "ASSETS", "Allocated AF-0019 Herman Miller Chair to Sriram Admin", "127.0.0.1"),
        ("log-2", "Priya Sharma", "BOOKINGS", "Created confirmed booking for Boardroom A (09:00 - 11:00)", "127.0.0.1"),
        ("log-3", "Vikram Mehta", "ASSETS", "Completed Check-In return for Ford Transit Van AF-V009 (Condition: Good)", "127.0.0.1"),
        ("log-4", "Rajesh Kumar", "MAINTENANCE", "Raised High-Priority repair ticket for ARRI SkyPanel AF-0088", "127.0.0.1")
    ])
    
    # Notifications
    cursor.executemany("INSERT INTO notifications VALUES (?, ?, ?, ?, datetime('now'));", [
        ("notif-1", "🚨 Overdue Return Alert", "Ananya Iyer is overdue returning iPad Pro AF-0044 (Due: 2026-07-08).", 0),
        ("notif-2", "🔧 Maintenance Approved", "MacBook Pro AF-0001 repair request has been approved and moved to Under Maintenance.", 0),
        ("notif-3", "📅 Booking Reminder", "Your booking for Boardroom A starts today at 09:00 AM.", 0)
    ])

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
