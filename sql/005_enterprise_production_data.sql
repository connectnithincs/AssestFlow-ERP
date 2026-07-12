-- ============================================================================
-- ASSETFLOW ENTERPRISE ERP - PRODUCTION DATA SEED PACK (005)
-- Realistic high-volume enterprise inventory ($250,000+ total valuation)
-- ============================================================================

-- Clear existing sample data if re-running
DELETE FROM notifications;
DELETE FROM activity_logs;
DELETE FROM audit_records;
DELETE FROM audit_cycles;
DELETE FROM maintenance_requests;
DELETE FROM resource_bookings;
DELETE FROM transfer_requests;
DELETE FROM asset_allocations;
DELETE FROM assets;
DELETE FROM asset_categories;
DELETE FROM users;
DELETE FROM departments;

-- 1. DEPARTMENTS (8 Real Corporate Divisions)
INSERT INTO departments (department_id, department_name, parent_id, manager_name, status) VALUES
('CORP-HQ', 'Executive & Global Headquarters', NULL, 'Sriram Admin', 'Active'),
('IT-GLOBAL', 'Global IT & Cloud Infrastructure', 'CORP-HQ', 'Priya Sharma', 'Active'),
('OPS-MEDIA', 'Media Production & Broadcasting', 'CORP-HQ', 'Rajesh Kumar', 'Active'),
('FIN-AUDIT', 'Internal Audit & Risk Compliance', 'CORP-HQ', 'Sriram Admin', 'Active'),
('ENG-CLOUD', 'Cloud Architecture & DevOps Engine', 'IT-GLOBAL', 'Alex Mercer', 'Active'),
('LOG-SUPPLY', 'Supply Chain & Fleet Operations', 'CORP-HQ', 'Marcus Vance', 'Active'),
('SEC-CYBER', 'Information Security & SOC Defense', 'IT-GLOBAL', 'Elena Rostova', 'Active'),
('HR-PEOPLE', 'People Operations & Talent Acquisition', 'CORP-HQ', 'Sarah Jenkins', 'Active');

-- 2. USERS (20 Enterprise Profiles across Roles & Departments)
INSERT INTO users (user_id, name, email, role, department_id, status, created_at) VALUES
('usr-01', 'Sriram Admin', 'admin@assetflow.local', 'Admin', 'CORP-HQ', 'Active', CURRENT_TIMESTAMP),
('usr-02', 'Priya Sharma', 'priya.sharma@assetflow.local', 'Asset Manager', 'IT-GLOBAL', 'Active', CURRENT_TIMESTAMP),
('usr-03', 'Rajesh Kumar', 'rajesh.kumar@assetflow.local', 'Department Head', 'OPS-MEDIA', 'Active', CURRENT_TIMESTAMP),
('usr-04', 'Alex Mercer', 'alex.mercer@assetflow.local', 'Department Head', 'ENG-CLOUD', 'Active', CURRENT_TIMESTAMP),
('usr-05', 'Elena Rostova', 'elena.rostova@assetflow.local', 'Department Head', 'SEC-CYBER', 'Active', CURRENT_TIMESTAMP),
('usr-06', 'Marcus Vance', 'marcus.vance@assetflow.local', 'Department Head', 'LOG-SUPPLY', 'Active', CURRENT_TIMESTAMP),
('usr-07', 'Sarah Jenkins', 'sarah.jenkins@assetflow.local', 'Department Head', 'HR-PEOPLE', 'Active', CURRENT_TIMESTAMP),
('usr-08', 'Ananya Iyer', 'ananya.iyer@assetflow.local', 'Employee', 'IT-GLOBAL', 'Active', CURRENT_TIMESTAMP),
('usr-09', 'Vikram Mehta', 'vikram.mehta@assetflow.local', 'Employee', 'OPS-MEDIA', 'Active', CURRENT_TIMESTAMP),
('usr-10', 'David Chen', 'david.chen@assetflow.local', 'Employee', 'ENG-CLOUD', 'Active', CURRENT_TIMESTAMP),
('usr-11', 'Liam O''Connor', 'liam.oconnor@assetflow.local', 'Employee', 'ENG-CLOUD', 'Active', CURRENT_TIMESTAMP),
('usr-12', 'Aisha Patel', 'aisha.patel@assetflow.local', 'Employee', 'SEC-CYBER', 'Active', CURRENT_TIMESTAMP),
('usr-13', 'Carlos Gomez', 'carlos.gomez@assetflow.local', 'Employee', 'LOG-SUPPLY', 'Active', CURRENT_TIMESTAMP),
('usr-14', 'Zoe Nakamura', 'zoe.nakamura@assetflow.local', 'Employee', 'OPS-MEDIA', 'Active', CURRENT_TIMESTAMP),
('usr-15', 'Thomas Wright', 'thomas.wright@assetflow.local', 'Employee', 'FIN-AUDIT', 'Active', CURRENT_TIMESTAMP),
('usr-16', 'Fiona Gallagher', 'fiona.gallagher@assetflow.local', 'Employee', 'HR-PEOPLE', 'Active', CURRENT_TIMESTAMP),
('usr-17', 'Kevin Thorne', 'kevin.thorne@assetflow.local', 'Employee', 'IT-GLOBAL', 'Active', CURRENT_TIMESTAMP),
('usr-18', 'Hannah Abbott', 'hannah.abbott@assetflow.local', 'Employee', 'OPS-MEDIA', 'Active', CURRENT_TIMESTAMP),
('usr-19', 'Benjamin Stark', 'benjamin.stark@assetflow.local', 'Employee', 'ENG-CLOUD', 'Active', CURRENT_TIMESTAMP),
('usr-20', 'Maya Lin', 'maya.lin@assetflow.local', 'Employee', 'SEC-CYBER', 'Active', CURRENT_TIMESTAMP);

-- 3. ASSET CATEGORIES (6 High-Value Schemas)
INSERT INTO asset_categories (category_id, category_name, default_warranty_months, custom_fields_schema, status) VALUES
('cat-1', 'Enterprise Computing & Laptops', 36, '{"CPU": "String", "RAM": "String", "SSD": "String", "MAC_Address": "String"}', 'Active'),
('cat-2', 'Broadcast Production & Optics', 24, '{"Sensor_Resolution": "String", "Lens_Mount": "String", "Firmware": "String"}', 'Active'),
('cat-3', 'Data Center & Network Infrastructure', 60, '{"Rack_Units": "Integer", "Port_Speed_Gbps": "Integer", "Power_Supply_Dual": "Boolean"}', 'Active'),
('cat-4', 'Executive Ergonomic Furniture', 120, '{"Material": "String", "Max_Load_Kg": "Integer", "Adjustable_Lumbar": "Boolean"}', 'Active'),
('cat-5', 'Field Fleet Vehicles & Logistics', 36, '{"VIN": "String", "License_Plate": "String", "Fuel_Type": "String", "Insurance_Expiry": "Date"}', 'Active'),
('cat-6', 'Diagnostic & Lab Instrumentation', 48, '{"Calibration_Frequency_Months": "Integer", "Accuracy_Tolerance": "String", "Cert_ID": "String"}', 'Active');

-- 4. MASTER ASSETS (40 Realistic Enterprise Inventory Items)
INSERT INTO assets (asset_id, asset_tag, asset_name, category_id, condition_status, location, department_id, lifecycle_status, serial_number, created_at) VALUES
-- Computing & Laptops (12 Items)
('ast-01', 'AF-0001', 'MacBook Pro M3 Max (16-inch, 64GB RAM, 2TB SSD)', 'cat-1', 'New', 'Server Depot Rack 1', 'IT-GLOBAL', 'Allocated', 'SN-APL-M3MAX-001', CURRENT_TIMESTAMP),
('ast-02', 'AF-0002', 'MacBook Pro M3 Max (16-inch, 64GB RAM, 2TB SSD)', 'cat-1', 'Good', 'Cloud Pod 4A', 'ENG-CLOUD', 'Allocated', 'SN-APL-M3MAX-002', CURRENT_TIMESTAMP),
('ast-03', 'AF-0003', 'MacBook Pro M3 Pro (14-inch, 36GB RAM, 1TB SSD)', 'cat-1', 'Good', 'Cyber SOC Bay 2', 'SEC-CYBER', 'Allocated', 'SN-APL-M3PRO-003', CURRENT_TIMESTAMP),
('ast-04', 'AF-0004', 'MacBook Pro M3 Pro (14-inch, 36GB RAM, 1TB SSD)', 'cat-1', 'Good', 'Cloud Pod 4B', 'ENG-CLOUD', 'Allocated', 'SN-APL-M3PRO-004', CURRENT_TIMESTAMP),
('ast-05', 'AF-0005', 'Dell Precision 7780 Mobile Workstation (i9, 128GB, RTX 5000)', 'cat-1', 'New', 'Broadcast Editing Suite 1', 'OPS-MEDIA', 'Allocated', 'SN-DELL-PREC-005', CURRENT_TIMESTAMP),
('ast-06', 'AF-0006', 'Dell Precision 7780 Mobile Workstation (i9, 128GB, RTX 5000)', 'cat-1', 'Good', 'Broadcast Editing Suite 2', 'OPS-MEDIA', 'Allocated', 'SN-DELL-PREC-006', CURRENT_TIMESTAMP),
('ast-07', 'AF-0007', 'Lenovo ThinkPad X1 Carbon Gen 11 (i7, 32GB RAM)', 'cat-1', 'Good', 'Executive Suite 301', 'CORP-HQ', 'Allocated', 'SN-LNV-X1C-007', CURRENT_TIMESTAMP),
('ast-08', 'AF-0008', 'Lenovo ThinkPad X1 Carbon Gen 11 (i7, 32GB RAM)', 'cat-1', 'Fair', 'Audit Field Desk 3', 'FIN-AUDIT', 'Allocated', 'SN-LNV-X1C-008', CURRENT_TIMESTAMP),
('ast-09', 'AF-0009', 'Dell XPS 15 OLED Laptop (i9, 32GB RAM)', 'cat-1', 'Good', 'Priya Desk 4B', 'IT-GLOBAL', 'Allocated', 'SN-DELL-XPS-009', CURRENT_TIMESTAMP),
('ast-10', 'AF-0010', 'Dell XPS 15 OLED Laptop (i9, 32GB RAM)', 'cat-1', 'Available', 'IT Buffer Pool Locker 12', 'IT-GLOBAL', 'Available', 'SN-DELL-XPS-010', CURRENT_TIMESTAMP),
('ast-11', 'AF-0011', 'iPad Pro 12.9-inch M2 w/ Apple Pencil Gen 2', 'cat-1', 'Poor', 'IT Depot Locker 8', 'IT-GLOBAL', 'Allocated', 'SN-APL-IPAD-011', CURRENT_TIMESTAMP),
('ast-12', 'AF-0012', 'Microsoft Surface Pro 9 (i7, 16GB, 512GB)', 'cat-1', 'Good', 'HR Interview Pod B', 'HR-PEOPLE', 'Allocated', 'SN-MSFT-SURF-012', CURRENT_TIMESTAMP),

-- Broadcast & Media (8 Items)
('ast-13', 'AF-0101', 'Sony FX6 Full-Frame Cinema Camera Kit w/ 24-105mm G Lens', 'cat-2', 'Good', 'Media Studio 1 - Camera Locker', 'OPS-MEDIA', 'Available', 'SN-SNY-FX6-101', CURRENT_TIMESTAMP),
('ast-14', 'AF-0102', 'Sony FX6 Full-Frame Cinema Camera Kit w/ 24-105mm G Lens', 'cat-2', 'Good', 'Media Studio 2 - Camera Locker', 'OPS-MEDIA', 'Allocated', 'SN-SNY-FX6-102', CURRENT_TIMESTAMP),
('ast-15', 'AF-0103', 'RED V-RAPTOR 8K VV Cinema Camera Body', 'cat-2', 'New', 'High-Security Vault 1', 'OPS-MEDIA', 'Available', 'SN-RED-VRAP-103', CURRENT_TIMESTAMP),
('ast-16', 'AF-0104', 'ARRI SkyPanel S60-C LED Softlight System', 'cat-2', 'Fair', 'Studio Maintenance Bay', 'OPS-MEDIA', 'Under Maintenance', 'SN-ARRI-S60-104', CURRENT_TIMESTAMP),
('ast-17', 'AF-0105', 'ARRI SkyPanel S60-C LED Softlight System', 'cat-2', 'Good', 'Media Studio 1 - Overhead Grid', 'OPS-MEDIA', 'Available', 'SN-ARRI-S60-105', CURRENT_TIMESTAMP),
('ast-18', 'AF-0106', 'Sennheiser MKH 416 Shotgun Microphone Kit', 'cat-2', 'Damaged', 'Sound Locker 3 Flagged Bin', 'OPS-MEDIA', 'Lost', 'SN-SNN-MKH-106', CURRENT_TIMESTAMP),
('ast-19', 'AF-0107', 'Sennheiser MKH 416 Shotgun Microphone Kit', 'cat-2', 'Good', 'Sound Locker 1', 'OPS-MEDIA', 'Available', 'SN-SNN-MKH-107', CURRENT_TIMESTAMP),
('ast-20', 'AF-0108', 'Blackmagic ATEM Constellation 8K Live Switcher', 'cat-2', 'Good', 'Master Control Room A', 'OPS-MEDIA', 'Available', 'SN-BMD-ATEM-108', CURRENT_TIMESTAMP),

-- Data Center & Network (8 Items)
('ast-21', 'AF-0201', 'Dell PowerEdge R750 Rack Server (Dual Xeon Gold 6338, 512GB RAM)', 'cat-3', 'New', 'Data Center Row C - Rack 14', 'ENG-CLOUD', 'Available', 'SN-DELL-R750-201', CURRENT_TIMESTAMP),
('ast-22', 'AF-0202', 'Dell PowerEdge R750 Rack Server (Dual Xeon Gold 6338, 512GB RAM)', 'cat-3', 'Good', 'Data Center Row C - Rack 15', 'ENG-CLOUD', 'Allocated', 'SN-DELL-R750-202', CURRENT_TIMESTAMP),
('ast-23', 'AF-0203', 'Cisco Catalyst 9300 48-Port PoE+ Enterprise Switch', 'cat-3', 'Good', 'Network Closet 2A', 'IT-GLOBAL', 'Allocated', 'SN-CSC-9300-203', CURRENT_TIMESTAMP),
('ast-24', 'AF-0204', 'Cisco Catalyst 9300 48-Port PoE+ Enterprise Switch', 'cat-3', 'Fair', 'IT Repair Depot Bay 4', 'IT-GLOBAL', 'Under Maintenance', 'SN-CSC-9300-204', CURRENT_TIMESTAMP),
('ast-25', 'AF-0205', 'Palo Alto PA-3410 Next-Generation Firewall Appliance', 'cat-3', 'Good', 'SOC Core Network Rack 1', 'SEC-CYBER', 'Allocated', 'SN-PA-3410-205', CURRENT_TIMESTAMP),
('ast-26', 'AF-0206', 'Fortinet FortiGate 200F Enterprise Security Gateway', 'cat-3', 'Good', 'Data Center Core Perimeter', 'SEC-CYBER', 'Allocated', 'SN-FGT-200F-206', CURRENT_TIMESTAMP),
('ast-27', 'AF-0207', 'APC Smart-UPS RT 10,000VA Online Battery Backup System', 'cat-3', 'Good', 'Data Center Row C - Power Distribution', 'IT-GLOBAL', 'Allocated', 'SN-APC-10KVA-207', CURRENT_TIMESTAMP),
('ast-28', 'AF-0208', 'Synology FlashStation FS3410 All-Flash SAN Storage (100TB TBW)', 'cat-3', 'Good', 'Cloud Core Storage Rack 2', 'ENG-CLOUD', 'Allocated', 'SN-SYN-FS3410-208', CURRENT_TIMESTAMP),

-- Ergonomic Furniture & Executive (6 Items)
('ast-29', 'AF-0301', 'Herman Miller Aeron Ergonomic Task Chair (Size B, Onyx)', 'cat-4', 'Good', 'Executive Suite 302', 'CORP-HQ', 'Allocated', 'SN-HM-AERON-301', CURRENT_TIMESTAMP),
('ast-30', 'AF-0302', 'Herman Miller Aeron Ergonomic Task Chair (Size B, Onyx)', 'cat-4', 'Good', 'SOC Command Deck Console 1', 'SEC-CYBER', 'Allocated', 'SN-HM-AERON-302', CURRENT_TIMESTAMP),
('ast-31', 'AF-0303', 'Steelcase Gesture Ergonomic Office Chair w/ Headrest', 'cat-4', 'Good', 'Cloud Engineering Pod 4', 'ENG-CLOUD', 'Allocated', 'SN-STC-GEST-303', CURRENT_TIMESTAMP),
('ast-32', 'AF-0304', 'Steelcase Gesture Ergonomic Office Chair w/ Headrest', 'cat-4', 'New', 'HR Director Suite 205', 'HR-PEOPLE', 'Allocated', 'SN-STC-GEST-304', CURRENT_TIMESTAMP),
('ast-33', 'AF-0305', 'Uplift V2 Commercial Height-Adjustable Standing Desk (72x30)', 'cat-4', 'Good', 'IT Global Engineering Cubicle 14', 'IT-GLOBAL', 'Allocated', 'SN-UPL-V2-305', CURRENT_TIMESTAMP),
('ast-34', 'AF-0306', 'Conference Room Modular Executive Table (16-Seat Walnut)', 'cat-4', 'Good', 'Boardroom A Main Floor', 'CORP-HQ', 'Allocated', 'SN-CNF-TBL-306', CURRENT_TIMESTAMP),

-- Fleet Vehicles & Lab Instrumentation (6 Items)
('ast-35', 'AF-V001', 'Ford Transit Custom Utility Van 4WD (Equipped Mobile Unit)', 'cat-5', 'Good', 'Underground Garage Bay 4', 'OPS-MEDIA', 'Available', 'SN-VAN-TRANSIT-001', CURRENT_TIMESTAMP),
('ast-36', 'AF-V002', 'Toyota Hilux Double Cab 4x4 Field Equipment Truck', 'cat-5', 'Fair', 'Fleet Maintenance Workshop Bay 1', 'LOG-SUPPLY', 'Under Maintenance', 'SN-TRK-HILUX-002', CURRENT_TIMESTAMP),
('ast-37', 'AF-V003', 'Mercedes-Benz Sprinter 3500 High-Roof Broadcast Satellite Van', 'cat-5', 'Good', 'Underground Garage Bay 1 - Secure', 'OPS-MEDIA', 'Allocated', 'SN-VAN-SPRINT-003', CURRENT_TIMESTAMP),
('ast-38', 'AF-0401', 'Fluke Networks DSX-8000 CableAnalyzer Pro Certification Kit', 'cat-6', 'Good', 'Network Diagnostic Depot Box 2', 'IT-GLOBAL', 'Available', 'SN-FLK-DSX8K-401', CURRENT_TIMESTAMP),
('ast-39', 'AF-0402', 'Tektronix MSO64 4-Channel Mixed Signal Oscilloscope (8 GHz)', 'cat-6', 'Fair', 'Hardware Calibration Lab Bench 3', 'ENG-CLOUD', 'Under Maintenance', 'SN-TEK-MSO64-402', CURRENT_TIMESTAMP),
('ast-40', 'AF-0403', 'FLIR E96 Advanced Thermal Imaging Camera System', 'cat-6', 'Good', 'Facility Safety Depot Locker 4', 'LOG-SUPPLY', 'Allocated', 'SN-FLIR-E96-403', CURRENT_TIMESTAMP);

-- 5. ASSET ALLOCATIONS (15 Historical & Active Records)
INSERT INTO asset_allocations (allocation_id, asset_id, user_id, allocated_by, allocation_date, expected_return_date, actual_return_date, return_condition, notes) VALUES
('alloc-01', 'ast-01', 'usr-04', 'Sriram Admin', '2026-06-01', '2026-12-31', NULL, NULL, 'Assigned for Kubernetes core architecture development'),
('alloc-02', 'ast-02', 'usr-10', 'Alex Mercer', '2026-06-10', '2026-11-30', NULL, NULL, 'Primary developer workstation'),
('alloc-03', 'ast-03', 'usr-05', 'Sriram Admin', '2026-05-15', '2026-12-31', NULL, NULL, 'SOC Lead primary defense laptop'),
('alloc-04', 'ast-04', 'usr-11', 'Alex Mercer', '2026-06-15', '2026-11-30', NULL, NULL, 'Cloud devops workstation'),
('alloc-05', 'ast-05', 'usr-03', 'Rajesh Kumar', '2026-06-01', '2026-10-31', NULL, NULL, '4K video rendering and color grading suite workstation'),
('alloc-06', 'ast-06', 'usr-09', 'Rajesh Kumar', '2026-06-05', '2026-10-31', NULL, NULL, 'Remote editing mobile workstation'),
('alloc-07', 'ast-07', 'usr-01', 'Sriram Admin', '2026-01-15', '2026-12-31', NULL, NULL, 'Executive management system access'),
('alloc-08', 'ast-08', 'usr-15', 'Sriram Admin', '2026-03-01', '2026-09-30', NULL, NULL, 'Audit field workstation'),
('alloc-09', 'ast-09', 'usr-02', 'Sriram Admin', '2026-04-01', '2026-12-31', NULL, NULL, 'IT asset management primary laptop'),
-- HIGH PRIORITY OVERDUE ALLOCATIONS (For Screen 2 Red Highlight Box)
('alloc-10', 'ast-11', 'usr-08', 'Priya Sharma', '2026-05-01', '2026-07-08', NULL, NULL, '🚨 OVERDUE: Field tablet loaned to Ananya Iyer for off-site inventory check. Past due 4 days!'),
('alloc-11', 'ast-14', 'usr-14', 'Rajesh Kumar', '2026-06-20', '2026-07-10', NULL, NULL, '🚨 OVERDUE: Sony FX6 loaned for weekend commercial shoot. Past due 2 days!'),
('alloc-12', 'ast-22', 'usr-19', 'Alex Mercer', '2026-06-01', '2026-12-31', NULL, NULL, 'Dedicated lab server for AI model training'),
('alloc-13', 'ast-29', 'usr-01', 'Sriram Admin', '2026-01-01', '2026-12-31', NULL, NULL, 'Executive office chair'),
('alloc-14', 'ast-37', 'usr-03', 'Sriram Admin', '2026-06-01', '2026-12-31', NULL, NULL, 'Permanent mobile broadcast satellite vehicle'),
('alloc-15', 'ast-40', 'usr-13', 'Marcus Vance', '2026-06-15', '2026-12-31', NULL, NULL, 'Logistics facility thermal inspection camera');

-- 6. TRANSFER REQUESTS (3 Active Conflict Resolution Workflows)
INSERT INTO transfer_requests (transfer_id, asset_id, current_holder_id, requested_by_id, transfer_reason, status, request_date) VALUES
('trf-01', 'ast-09', 'usr-02', 'usr-17', 'Need Dell XPS OLED for 3D network topology modeling project.', 'pending', '2026-07-11'),
('trf-02', 'ast-14', 'usr-14', 'usr-09', 'Overdue asset needed immediately for Studio 2 live sports broadcast setup.', 'pending', '2026-07-12'),
('trf-03', 'ast-22', 'usr-19', 'usr-10', 'Transferring AI test server to secondary devops engineer for stress testing.', 'approved', '2026-07-09');

-- 7. RESOURCE BOOKINGS (8 Realistic Schedule Windows)
INSERT INTO resource_bookings (booking_id, resource_name, user_id, start_time, end_time, purpose, status) VALUES
('bk-01', 'Boardroom A (4K Video Conferencing)', 'usr-01', '2026-07-12 09:00:00', '2026-07-12 11:00:00', 'Executive Strategy Roadmap & Q3 Budget Review', 'confirmed'),
('bk-02', 'Boardroom A (4K Video Conferencing)', 'usr-05', '2026-07-12 11:30:00', '2026-07-12 13:00:00', 'Global SOC Security Incident Response Briefing', 'confirmed'),
('bk-03', 'Boardroom A (4K Video Conferencing)', 'usr-07', '2026-07-12 14:00:00', '2026-07-12 16:00:00', 'Executive Talent Leadership Workshop', 'confirmed'),
('bk-04', 'Utility Van Ford Transit (AF-V001)', 'usr-03', '2026-07-12 13:00:00', '2026-07-12 18:00:00', 'On-Location Live Event Broadcast Setup at Downtown Arena', 'confirmed'),
('bk-05', 'Utility Van Ford Transit (AF-V001)', 'usr-06', '2026-07-13 08:00:00', '2026-07-13 12:00:00', 'Regional Warehouse Hardware Transport & Deployment', 'confirmed'),
('bk-06', 'Executive Suite B2 (Private Soundproof)', 'usr-04', '2026-07-12 10:00:00', '2026-07-12 12:00:00', 'Cloud Vendor Multi-Million Dollar SLA Negotiations', 'confirmed'),
('bk-07', 'Diagnostic Lab Chamber 3 (RF Shielded)', 'usr-02', '2026-07-12 14:00:00', '2026-07-12 17:00:00', 'High-Frequency Oscilloscope Network Calibration', 'confirmed'),
('bk-08', 'Boardroom A (4K Video Conferencing)', 'usr-03', '2026-07-13 10:00:00', '2026-07-13 12:00:00', 'Media Production Partners Quarterly Review', 'confirmed');

-- 8. MAINTENANCE REQUESTS (6 Active & Historical Repair Workflows)
INSERT INTO maintenance_requests (request_id, asset_id, requested_by, priority_level, issue_title, detailed_description, status, estimated_cost, actual_cost, created_at) VALUES
('mnt-01', 'ast-16', 'Rajesh Kumar', 'high', 'ARRI SkyPanel Power Ballast Thermal Shutdown', 'Driver ballast overheats after 45 minutes of continuous 100% output during studio filming.', 'in_progress', 650.00, NULL, '2026-07-10'),
('mnt-02', 'ast-24', 'Priya Sharma', 'medium', 'Cisco Catalyst 9300 Fan Module 2 Failure Alarm', 'Switch reporting high RPM fluctuations and warning alerts on secondary cooling module.', 'in_progress', 420.00, NULL, '2026-07-11'),
('mnt-03', 'ast-36', 'Marcus Vance', 'high', 'Toyota Hilux 4x4 Front Differential & Transmission Service', 'Heavy vibration noticed during off-road field transport. Scheduled for transmission overhaul.', 'in_progress', 2150.00, NULL, '2026-07-09'),
('mnt-04', 'ast-39', 'Alex Mercer', 'high', 'Tektronix MSO64 Oscilloscope Channel 3 Attenuation Drift', 'Signal waveform showing +1.2dB calibration drift above 5GHz. Sent to lab for recertification.', 'in_progress', 1800.00, NULL, '2026-07-08'),
('mnt-05', 'ast-11', 'Ananya Iyer', 'medium', 'iPad Pro Screen Digitizer Intermittent Edge Drop', 'Touch input drops near right bezel when using Apple Pencil in landscape mode.', 'pending', 280.00, NULL, '2026-07-11'),
('mnt-06', 'ast-01', 'Sriram Admin', 'low', 'MacBook Pro Battery Health Check & Keyboard Clean', 'Routine annual preventive maintenance completed successfully.', 'resolved', 150.00, 145.00, '2026-06-20');

-- 9. AUDIT CYCLES (2 Comprehensive Global Verifications)
INSERT INTO audit_cycles (cycle_id, title, department_scope, start_date, end_date, status) VALUES
('aud-201', 'Q3 Global IT & Infrastructure Verification Audit', 'IT-GLOBAL, ENG-CLOUD, SEC-CYBER', '2026-07-01', '2026-07-15', 'In-Progress'),
('aud-202', 'Annual Media Production Studio Equipment Audit', 'OPS-MEDIA', '2026-06-15', '2026-06-30', 'Closed');

-- 10. AUDIT RECORDS (12 Detailed Checklists across both Cycles)
INSERT INTO audit_records (record_id, cycle_id, asset_id, baseline_status, verification_status, auditor_notes) VALUES
('rec-01', 'aud-201', 'ast-01', 'Allocated', 'Verified', 'Verified laptop tag AF-0001 with Alex Mercer in Server Depot.'),
('rec-02', 'aud-201', 'ast-03', 'Allocated', 'Verified', 'Verified in Cyber SOC Bay 2 with Elena Rostova.'),
('rec-03', 'aud-201', 'ast-09', 'Allocated', 'Verified', 'Verified Dell XPS OLED on Priya Sharma desk.'),
('rec-04', 'aud-201', 'ast-11', 'Allocated', 'Missing', '❌ NOT FOUND at Ananya Iyer desk. Marked as overdue return!'),
('rec-05', 'aud-201', 'ast-21', 'Available', 'Verified', 'PowerEdge R750 inspected in Data Center Row C Rack 14.'),
('rec-06', 'aud-201', 'ast-23', 'Allocated', 'Verified', 'Cisco Catalyst switch verified active in Network Closet 2A.'),
('rec-07', 'aud-201', 'ast-38', 'Available', 'Verified', 'Fluke DSX-8000 certification kit verified in depot.'),
('rec-08', 'aud-202', 'ast-13', 'Available', 'Verified', 'Sony FX6 Kit 101 verified complete in Studio 1 camera locker.'),
('rec-09', 'aud-202', 'ast-15', 'Available', 'Verified', 'RED V-RAPTOR 8K camera verified inside High-Security Vault 1.'),
('rec-10', 'aud-202', 'ast-16', 'Under Maintenance', 'Verified', 'ARRI SkyPanel confirmed in studio repair bay awaiting power ballast.'),
('rec-11', 'aud-202', 'ast-18', 'Available', 'Missing', '❌ Sennheiser Shotgun Mic Kit not found in Sound Locker 3! Flagged during cycle.'),
('rec-12', 'aud-202', 'ast-35', 'Available', 'Verified', 'Ford Transit Utility Van verified parked in Underground Garage Bay 4.');

-- 11. ACTIVITY LOGS (15 Rich Enterprise Audit Trail Entries)
INSERT INTO activity_logs (log_id, created_at, user_name, module_name, action_description, ip_address) VALUES
('log-01', datetime('now', '-5 hours'), 'Sriram Admin', 'ASSETS', 'Registered 4 new MacBook Pro M3 Max/Pro laptops for Cloud & SOC engineering teams.', '10.0.1.15'),
('log-02', datetime('now', '-4 hours'), 'Priya Sharma', 'ASSETS', 'Initiated annual calibration audit cycle aud-201 across all IT & Cloud divisions.', '10.0.2.44'),
('log-03', datetime('now', '-4 hours'), 'Rajesh Kumar', 'BOOKINGS', 'Confirmed booking bk-04 for Utility Van Ford Transit for weekend stadium broadcast shoot.', '10.0.3.88'),
('log-04', datetime('now', '-3 hours'), 'Alex Mercer', 'ASSETS', 'Approved transfer request trf-03 moving PowerEdge AI test server to secondary engineer.', '10.0.4.12'),
('log-05', datetime('now', '-3 hours'), 'Marcus Vance', 'MAINTENANCE', 'Raised High-Priority repair request mnt-03 for Toyota Hilux transmission overhaul ($2,150).', '10.0.5.60'),
('log-06', datetime('now', '-2 hours'), 'Elena Rostova', 'BOOKINGS', 'Confirmed booking bk-02 for Boardroom A for global SOC security briefing.', '10.0.6.21'),
('log-07', datetime('now', '-2 hours'), 'Sriram Admin', 'ORG_SETUP', 'Promoted Priya Sharma to Asset Manager and Alex Mercer to Department Head (ENG-CLOUD).', '10.0.1.15'),
('log-08', datetime('now', '-1 hours'), 'Priya Sharma', 'AUDIT', 'Marked iPad Pro AF-0011 as MISSING during Q3 verification audit aud-201.', '10.0.2.44'),
('log-09', datetime('now', '-45 minutes'), 'Rajesh Kumar', 'MAINTENANCE', 'Raised High-Priority repair request mnt-01 for ARRI SkyPanel power ballast.', '10.0.3.88'),
('log-10', datetime('now', '-30 minutes'), 'Ananya Iyer', 'ASSETS', 'Submitted maintenance ticket mnt-05 for iPad Pro screen digitizer responsiveness.', '10.0.2.99'),
('log-11', datetime('now', '-20 minutes'), 'Sriram Admin', 'AUDIT', 'Closed Studio Audit aud-202. Auto-reconciled missing Sennheiser Mic AF-0108 to LOST status.', '10.0.1.15'),
('log-12', datetime('now', '-15 minutes'), 'Vikram Mehta', 'ASSETS', 'Completed physical check-in return for Sony FX6 camera kit (Condition verified: Good).', '10.0.3.50'),
('log-13', datetime('now', '-10 minutes'), 'Alex Mercer', 'ASSETS', 'Allocated Dell PowerEdge R750 Server AF-0202 to AI research workbench.', '10.0.4.12'),
('log-14', datetime('now', '-5 minutes'), 'Sarah Jenkins', 'BOOKINGS', 'Booked Boardroom A for Executive Talent Workshop (14:00 - 16:00).', '10.0.7.19'),
('log-15', datetime('now', '-1 minutes'), 'Sriram Admin', 'SYSTEM', 'Production dataset 005 loaded successfully with 40+ enterprise assets ($250,000+ valuation).', '127.0.0.1');

-- 12. NOTIFICATIONS (5 Active Priority Alerts)
INSERT INTO notifications (notification_id, title, message, is_read, created_at) VALUES
('notif-01', '🚨 Overdue Return Alert', 'Ananya Iyer is overdue returning iPad Pro AF-0011 (Due: 2026-07-08). Asset marked as Missing in Q3 Audit.', 0, datetime('now', '-2 hours')),
('notif-02', '🚨 Overdue Return Alert', 'Zoe Nakamura is overdue returning Sony FX6 Camera AF-0102 (Due: 2026-07-10).', 0, datetime('now', '-1 hours')),
('notif-03', '🔧 High-Priority Repair Raised', 'Toyota Hilux 4x4 AF-V002 front differential & transmission overhaul requested ($2,150 estimated cost).', 0, datetime('now', '-45 minutes')),
('notif-04', '⚠️ Verification Audit Flag', 'Q3 Global IT Verification Audit aud-201 has flagged 2 assets requiring manager reconciliation.', 0, datetime('now', '-30 minutes')),
('notif-05', '📅 Executive Booking Reminder', 'Your booking for Boardroom A (Executive Strategy Roadmap) begins today at 09:00 AM.', 0, datetime('now', '-10 minutes'));
