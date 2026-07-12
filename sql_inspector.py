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
            try:
                web_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web", "index.html")
                with open(web_path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(content.encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-type", "text/plain")
                self.end_headers()
                self.wfile.write(f"Error loading UI: {e}".encode("utf-8"))

    def send_json(self, data):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))


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
