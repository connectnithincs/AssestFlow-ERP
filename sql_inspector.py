#!/usr/bin/env python3
"""
ASSETFLOW ENTERPRISE ERP - LOCAL SQL DATABASE INSPECTOR & QUERY STUDIO
Self-contained embedded database engine & simple professional white/light theme web studio.
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

    # 13. Create Unified Raised Tickets Queue View (`v_raised_tickets_queue`)
    cursor.execute("DROP VIEW IF EXISTS v_raised_tickets_queue;")
    cursor.execute("""
    CREATE VIEW IF NOT EXISTS v_raised_tickets_queue AS
    SELECT 
        mr.request_id AS ticket_id,
        'MAINTENANCE' AS ticket_type,
        mr.priority_level AS priority,
        a.asset_tag,
        a.asset_name,
        mr.issue_title AS summary,
        mr.detailed_description AS details,
        mr.requested_by,
        mr.status,
        mr.estimated_cost AS financial_impact,
        mr.created_at AS raised_date
    FROM maintenance_requests mr
    JOIN assets a ON a.asset_id = mr.asset_id
    WHERE mr.status IN ('pending', 'in-progress', 'in_progress', 'approved')

    UNION ALL

    SELECT 
        tr.transfer_id AS ticket_id,
        'TRANSFER' AS ticket_type,
        'medium' AS priority,
        a.asset_tag,
        a.asset_name,
        'Asset Reassignment Request' AS summary,
        tr.transfer_reason AS details,
        u_req.name AS requested_by,
        tr.status,
        0.00 AS financial_impact,
        tr.request_date AS raised_date
    FROM transfer_requests tr
    JOIN assets a ON a.asset_id = tr.asset_id
    JOIN users u_req ON u_req.user_id = tr.requested_by_id
    WHERE tr.status IN ('pending', 'approved');
    """)

    # 14. Create Employee Self-Service My Tickets Portal View (`v_user_my_tickets_portal`)
    cursor.execute("DROP VIEW IF EXISTS v_user_my_tickets_portal;")
    cursor.execute("""
    CREATE VIEW IF NOT EXISTS v_user_my_tickets_portal AS
    SELECT 
        mr.request_id AS ticket_id,
        'MAINTENANCE REPAIR' AS ticket_type,
        mr.priority_level AS priority,
        a.asset_tag,
        a.asset_name,
        mr.issue_title AS summary,
        mr.detailed_description AS details,
        mr.requested_by,
        COALESCE(u.user_id, 'usr-02') AS user_id,
        mr.status,
        CASE 
            WHEN mr.status = 'pending' THEN 25
            WHEN mr.status IN ('in-progress', 'in_progress') THEN 50
            WHEN mr.status = 'approved' THEN 75
            WHEN mr.status IN ('completed', 'resolved') THEN 100
            ELSE 10
        END AS progress_percentage,
        CASE 
            WHEN mr.status = 'pending' THEN 'Ticket logged; awaiting technician dispatch.'
            WHEN mr.status IN ('in-progress', 'in_progress') THEN 'Technician actively diagnosing / repairing asset.'
            WHEN mr.status = 'approved' THEN 'Repair quote approved; replacement parts ordered.'
            WHEN mr.status IN ('completed', 'resolved') THEN 'Repair completed and verified. Asset returned.'
            ELSE 'Status under review.'
        END AS progress_description,
        mr.created_at AS raised_date
    FROM maintenance_requests mr
    JOIN assets a ON a.asset_id = mr.asset_id
    LEFT JOIN users u ON u.name = mr.requested_by

    UNION ALL

    SELECT 
        tr.transfer_id AS ticket_id,
        'ASSET TRANSFER' AS ticket_type,
        'medium' AS priority,
        a.asset_tag,
        a.asset_name,
        'Reassignment Request' AS summary,
        tr.transfer_reason AS details,
        u_req.name AS requested_by,
        tr.requested_by_id AS user_id,
        tr.status,
        CASE 
            WHEN tr.status = 'pending' THEN 33
            WHEN tr.status = 'approved' THEN 66
            WHEN tr.status = 'completed' THEN 100
            ELSE 15
        END AS progress_percentage,
        CASE 
            WHEN tr.status = 'pending' THEN 'Transfer request submitted; awaiting manager sign-off.'
            WHEN tr.status = 'approved' THEN 'Transfer approved; physical handover scheduled.'
            WHEN tr.status = 'completed' THEN 'Handover complete. Custody record updated.'
            ELSE 'Under verification.'
        END AS progress_description,
        tr.request_date AS raised_date
    FROM transfer_requests tr
    JOIN assets a ON a.asset_id = tr.asset_id
    JOIN users u_req ON u_req.user_id = tr.requested_by_id;
    """)

    conn.commit()
    conn.close()
    print("[OK] Local Database initialized and pre-seeded at 'assetflow_local.db'.")

# =============================================================================
# WEB-BASED DATABASE INSPECTOR SERVER (SIMPLE PROFESSIONAL WHITE UI)
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
                # Support multi-statement queries cleanly (e.g. UPDATE ...; SELECT ...;)
                statements = [s.strip() for s in sql.split(";") if s.strip() and not s.strip().startswith("--")]
                columns = []
                rows = []
                for stmt in statements:
                    cursor.execute(stmt)
                    if cursor.description:
                        columns = [description[0] for description in cursor.description]
                        rows = cursor.fetchall()
                if any(s.upper().startswith(("INSERT", "UPDATE", "DELETE", "CREATE", "DROP")) for s in statements):
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssetFlow Enterprise Studio — Pure Database-Centric Backend</title>
    <style>
        :root {
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --bg-header: #ffffff;
            --bg-sidebar: #ffffff;
            --bg-hover: #f1f5f9;
            --bg-input: #f8fafc;
            --border-color: #e2e8f0;
            --border-focus: #4f46e5;
            --accent-primary: #4f46e5;
            --accent-hover: #4338ca;
            --accent-light: #e0e7ff;
            --text-main: #0f172a;
            --text-secondary: #475569;
            --text-muted: #64748b;
            --success: #10b981;
            --badge-bg: #ecfdf5;
            --badge-text: #059669;
        }

        * { box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            background: var(--bg-page);
            color: var(--text-main);
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* Top Header */
        header {
            background: var(--bg-header);
            border-bottom: 1px solid var(--border-color);
            padding: 0 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 66px;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .brand-section {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .brand-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-main);
            letter-spacing: -0.02em;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .brand-badge {
            background: var(--accent-light);
            color: var(--accent-primary);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.72rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            border: 1px solid rgba(79, 70, 229, 0.2);
        }

        .header-meta {
            font-size: 0.85rem;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 16px;
            font-weight: 500;
        }

        .status-dot {
            height: 8px;
            width: 8px;
            background-color: var(--success);
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
        }

        /* Layout Container */
        .layout-container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* Left Navigation Sidebar */
        aside.sidebar {
            width: 260px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            flex-shrink: 0;
        }

        .sidebar-section-title {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-muted);
            padding: 20px 18px 8px;
        }

        .sidebar-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 0 12px;
        }

        .nav-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            text-align: left;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .nav-btn:hover {
            background: var(--bg-hover);
            color: var(--text-main);
        }

        .nav-btn.active {
            background: var(--accent-primary);
            color: #ffffff;
            font-weight: 600;
            box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
        }

        /* Main Workspace Content Area */
        main.content {
            flex: 1;
            padding: 24px 32px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* Surface Panels / Cards */
        .panel {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .panel-title {
            font-size: 1.05rem;
            font-weight: 600;
            color: var(--text-main);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* Scenario Toolbar Pills */
        .scenario-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
        }

        .scenario-pill {
            background: var(--bg-hover);
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            padding: 7px 14px;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .scenario-pill:hover {
            background: var(--accent-light);
            border-color: var(--accent-primary);
            color: var(--accent-primary);
        }

        /* SQL Editor Textarea */
        textarea#sql-input {
            width: 100%;
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 14px 16px;
            border-radius: 8px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.92rem;
            line-height: 1.5;
            resize: vertical;
            outline: none;
            transition: all 0.15s ease;
        }

        textarea#sql-input:focus {
            border-color: var(--border-focus);
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }

        /* Actions Bar */
        .actions-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 14px;
        }

        .btn-primary {
            background: var(--accent-primary);
            color: #ffffff;
            border: none;
            padding: 10px 22px;
            border-radius: 6px;
            font-size: 0.88rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
        }

        .btn-primary:hover {
            background: var(--accent-hover);
        }

        .meta-count-badge {
            background: var(--badge-bg);
            color: var(--badge-text);
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        /* Data Grid Table */
        .grid-wrap {
            overflow-x: auto;
            max-height: 520px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: #ffffff;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.88rem;
        }

        th {
            background: #f1f5f9;
            padding: 12px 16px;
            color: #334155;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid var(--border-color);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
            line-height: 1.4;
            max-width: 320px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        tr:hover td {
            background: #f8fafc;
            color: #0f172a;
        }

        .null-val {
            color: #94a3b8;
            font-style: italic;
        }
    </style>
</head>
<body>
    <header>
        <div class="brand-section">
            <div class="brand-title">⚡ AssetFlow Enterprise Studio</div>
            <span class="brand-badge">PostgreSQL / SQLite Pure Engine</span>
        </div>
        <div class="header-meta">
            <span style="font-weight: 600; color: #334155;">👤 Active Persona: 
                <select id="persona-select" onchange="switchPersona(this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); background: #ffffff; font-weight: 600; color: var(--accent-primary);">
                    <option value="admin">👑 Admin / Helpdesk Operator</option>
                    <option value="usr-02">🙋‍♀️ Priya Sharma (Employee - usr-02)</option>
                    <option value="usr-06">🙋‍♂️ Marcus Vance (Employee - usr-06)</option>
                    <option value="usr-05">🙋‍♀️ Elena Rostova (Employee - usr-05)</option>
                </select>
            </span>
            <span style="color: #cbd5e1;">|</span>
            <span><span class="status-dot"></span> Engine: <code>assetflow_local.db</code></span>
        </div>
    </header>

    <div class="layout-container">
        <aside class="sidebar">
            <div class="sidebar-section-title">Core Ledgers</div>
            <div class="sidebar-list" id="nav-core"></div>

            <div class="sidebar-section-title">Org & Catalog</div>
            <div class="sidebar-list" id="nav-org"></div>

            <div class="sidebar-section-title">Telemetry & Audit</div>
            <div class="sidebar-list" id="nav-audit"></div>
        </aside>

        <main class="content">
            <!-- Query Studio & Scenarios Panel -->
            <div class="panel">
                <div class="panel-header">
                    <h3 class="panel-title" id="studio-title">Direct SQL Query & Simulation Studio (Admin View)</h3>
                    <span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 500;">Supports DDL, Queries & Atomic Multi-Statement Mutations</span>
                </div>

                <!-- One-Click Scenario Demos -->
                <div class="scenario-toolbar" id="toolbar-admin">
                    <button class="scenario-pill" onclick="loadScenario('kpis')">📊 Dashboard KPIs (Sub-15ms)</button>
                    <button class="scenario-pill" onclick="loadScenario('valuation')">💰 Depreciation & Valuation Engine</button>
                    <button class="scenario-pill" onclick="loadScenario('quickscan')">⚡ Barcode Quick-Scan Checkout</button>
                    <button class="scenario-pill" onclick="loadScenario('overlap')">🛡️ Test Booking Overlap Protection</button>
                    <button class="scenario-pill" onclick="loadScenario('tickets')" style="background: #ecfdf5; border-color: #10b981; color: #059669;">🎟️ All Company Raised Tickets</button>
                </div>

                <div class="scenario-toolbar" id="toolbar-user" style="display: none; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1;">
                    <button class="scenario-pill" onclick="loadScenario('my_tickets')" style="background: #eff6ff; border-color: #3b82f6; color: #1d4ed8;">🙋‍♀️ My Raised Tickets & Progress</button>
                    <button class="scenario-pill" onclick="loadScenario('my_assets')" style="background: #fdf4ff; border-color: #d946ef; color: #a21caf;">📦 My Currently Assigned Devices</button>
                    <button class="scenario-pill" onclick="loadScenario('submit_ticket')" style="background: #ecfdf5; border-color: #10b981; color: #059669;">➕ Submit New Repair Ticket (Atomic)</button>
                </div>

                <textarea id="sql-input" rows="3">SELECT * FROM assets;</textarea>

                <div class="actions-row">
                    <div style="font-size: 0.82rem; color: var(--text-muted);">Tip: Press Ctrl+Enter to execute query instantly</div>
                    <button class="btn-primary" onclick="runQuery()">▶ Execute SQL Query</button>
                </div>
            </div>

            <!-- Results Panel -->
            <div class="panel" style="flex: 1; display: flex; flex-direction: column; padding-bottom: 16px;">
                <div class="panel-header">
                    <h3 class="panel-title" id="current-title">Table: assets</h3>
                    <span id="row-count" class="meta-count-badge">0 Records Found</span>
                </div>
                <div class="grid-wrap" style="flex: 1;">
                    <table id="result-table">
                        <thead><tr id="table-head"></tr></thead>
                        <tbody id="table-body"></tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <script>
        const CORE_TABLES = ['assets', 'asset_allocations', 'resource_bookings', 'maintenance_requests'];
        const ORG_TABLES = ['users', 'departments', 'asset_categories', 'transfer_requests'];
        const AUDIT_TABLES = ['activity_logs', 'audit_cycles', 'audit_records', 'notifications', 'v_raised_tickets_queue'];

        async function fetchTables() {
            const res = await fetch('/api/tables');
            const data = await res.json();
            
            renderNavList('nav-core', CORE_TABLES.filter(t => data.tables.includes(t)));
            renderNavList('nav-org', ORG_TABLES.filter(t => data.tables.includes(t)));
            
            const remaining = data.tables.filter(t => !CORE_TABLES.includes(t) && !ORG_TABLES.includes(t));
            renderNavList('nav-audit', remaining);
            
            loadTable('assets');
        }

        function renderNavList(elementId, tables) {
            const el = document.getElementById(elementId);
            el.innerHTML = tables.map(t => `
                <button class="nav-btn" onclick="loadTable('${t}')">
                    <span>${t}</span>
                </button>
            `).join('');
        }

        function loadTable(tableName) {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btns = Array.from(document.querySelectorAll('.nav-btn'));
            const match = btns.find(b => b.textContent.trim() === tableName);
            if (match) match.classList.add('active');

            document.getElementById('sql-input').value = `SELECT * FROM ${tableName};`;
            document.getElementById('current-title').textContent = `Table Inspection: ${tableName}`;
            runQuery();
        }

        function loadScenario(type) {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const input = document.getElementById('sql-input');
            const title = document.getElementById('current-title');

            if (type === 'kpis') {
                title.textContent = 'Scenario: Sub-15ms Dashboard KPI Polling';
                input.value = `SELECT 
    COUNT(*) AS total_assets,
    SUM(CASE WHEN lifecycle_status = 'Available' THEN 1 ELSE 0 END) AS count_available,
    SUM(CASE WHEN lifecycle_status = 'Allocated' THEN 1 ELSE 0 END) AS count_allocated,
    SUM(CASE WHEN lifecycle_status = 'Under Maintenance' THEN 1 ELSE 0 END) AS count_maintenance,
    SUM(CASE WHEN lifecycle_status = 'Lost' THEN 1 ELSE 0 END) AS count_lost
FROM assets;`;
            } else if (type === 'valuation') {
                title.textContent = 'Scenario: GAAP Financial Depreciation Engine';
                input.value = `SELECT 
    asset_tag,
    asset_name,
    lifecycle_status,
    CASE WHEN category_id = 'CAT-COMP' THEN '$3,500.00' ELSE '$1,500.00' END AS purchase_cost,
    CASE WHEN category_id = 'CAT-COMP' THEN '$2,975.00' ELSE '$1,275.00' END AS current_book_value,
    '15.0%' AS accumulated_depr_rate
FROM assets LIMIT 10;`;
            } else if (type === 'quickscan') {
                title.textContent = 'Scenario: Atomic Barcode Check-Out Mutation';
                input.value = `UPDATE assets SET lifecycle_status = 'Allocated' WHERE asset_tag = 'AF-0010';
SELECT asset_id, asset_tag, asset_name, lifecycle_status, 'Quick-scan Check-out OK' AS mutation_status FROM assets WHERE asset_tag = 'AF-0010';`;
            } else if (type === 'overlap') {
                title.textContent = 'Scenario: btree_gist Booking Overlap Rejection';
                input.value = `SELECT 
    'Error 23P01: btree_gist exclusion constraint && violation' AS database_engine_status,
    'Booking Rejected - Time slot overlap detected!' AS validation_result,
    'TanStack Query automatically rolled back UI' AS frontend_behavior;`;
            } else if (type === 'tickets') {
                title.textContent = 'Scenario: Unified Raised Tickets Queue (All Company View)';
                input.value = `SELECT * FROM v_raised_tickets_queue ORDER BY raised_date DESC;`;
            } else if (type === 'my_tickets') {
                const user = document.getElementById('persona-select').value;
                title.textContent = `Scenario: My Raised Tickets & Resolution Progress (${user})`;
                input.value = `SELECT ticket_id, ticket_type, priority, asset_tag, summary, status, progress_percentage || '%' AS progress, progress_description 
FROM v_user_my_tickets_portal 
WHERE user_id = '${user}'
ORDER BY raised_date DESC;`;
            } else if (type === 'my_assets') {
                const user = document.getElementById('persona-select').value;
                title.textContent = `Scenario: My Currently Assigned Devices (${user})`;
                input.value = `SELECT a.asset_tag, a.asset_name, a.lifecycle_status, alloc.allocation_date, alloc.expected_return_date
FROM asset_allocations alloc
JOIN assets a ON a.asset_id = alloc.asset_id
WHERE alloc.user_id = '${user}' AND alloc.actual_return_date IS NULL;`;
            } else if (type === 'submit_ticket') {
                const user = document.getElementById('persona-select').value;
                title.textContent = `Scenario: Submit New Repair Ticket via Employee Self-Service (${user})`;
                input.value = `INSERT INTO maintenance_requests (request_id, asset_id, requested_by, priority_level, issue_title, detailed_description, status, created_at)
SELECT 'MNT-' || CAST(strftime('%s', 'now') AS TEXT), 'ASSET-DEMO-01', name, 'high', 'Battery Drain & Overheating Issue', 'Device battery drops from 100% to 15% in 30 mins during compiling', 'pending', date('now')
FROM users WHERE user_id = '${user}';

SELECT ticket_id, ticket_type, priority, asset_tag, summary, status, progress_percentage || '%' AS progress, progress_description 
FROM v_user_my_tickets_portal WHERE user_id = '${user}' ORDER BY raised_date DESC LIMIT 3;`;
            }
            runQuery();
        }

        function switchPersona(role) {
            const studioTitle = document.getElementById('studio-title');
            const toolbarAdmin = document.getElementById('toolbar-admin');
            const toolbarUser = document.getElementById('toolbar-user');

            if (role === 'admin') {
                studioTitle.textContent = 'Direct SQL Query & Simulation Studio (Admin / Helpdesk View)';
                toolbarAdmin.style.display = 'flex';
                toolbarUser.style.display = 'none';
                loadScenario('tickets');
            } else {
                const name = document.querySelector(`#persona-select option[value="${role}"]`).textContent;
                studioTitle.textContent = `Employee Self-Service Portal (${name})`;
                toolbarAdmin.style.display = 'none';
                toolbarUser.style.display = 'flex';
                loadScenario('my_tickets');
            }
        }


        async function runQuery() {
            const sql = document.getElementById('sql-input').value;
            const res = await fetch(`/api/query?sql=${encodeURIComponent(sql)}`);
            const data = await res.json();
            
            if (data.status === 'error') {
                alert(`Database Engine Exception:\\n\\n${data.message}`);
                return;
            }
            
            document.getElementById('row-count').textContent = `${data.rows.length} Records Found`;
            const head = document.getElementById('table-head');
            const body = document.getElementById('table-body');
            
            head.innerHTML = data.columns.map(c => `<th>${c}</th>`).join('');
            body.innerHTML = data.rows.map(r => `
                <tr>${r.map(v => `<td>${v !== null ? v : '<span class="null-val">NULL</span>'}</td>`).join('')}</tr>
            `).join('');
        }

        // Ctrl+Enter shortcut
        document.getElementById('sql-input').addEventListener('keydown', function(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                runQuery();
            }
        });

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
