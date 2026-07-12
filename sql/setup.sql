-- ============================================================================
-- ASSETFLOW ENTERPRISE ASSET & RESOURCE MANAGEMENT SYSTEM
-- Setup & Seeding Script (`setup.sql` / `004_seed_data.sql`)
-- Initializes sample Admin User, Departments, Asset Categories, and Demo Assets
-- to demonstrate immediate out-of-the-box functionality.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SEED DEPARTMENTS HIERARCHY
-- ============================================================================
INSERT INTO departments (id, code, name, description, is_active)
VALUES
    ('d1111111-1111-4111-8111-111111111111', 'CORP-HQ', 'Executive Operations & Global HQ', 'Top-level corporate management', TRUE),
    ('d2222222-2222-4222-8222-222222222222', 'IT-GLOBAL', 'Global Information Technology', 'Enterprise hardware, network, and cloud infrastructure', TRUE),
    ('d3333333-3333-4333-8333-333333333333', 'OPS-MEDIA', 'Creative & Production Studio', 'A/V production, camera equipment, and broadcasting facilities', TRUE)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Link IT-GLOBAL and OPS-MEDIA as child departments of CORP-HQ
UPDATE departments 
SET parent_department_id = 'd1111111-1111-4111-8111-111111111111'
WHERE id IN ('d2222222-2222-4222-8222-222222222222', 'd3333333-3333-4333-8333-333333333333');

-- ============================================================================
-- 2. SEED ADMIN USER & CORE EMPLOYEES
-- ============================================================================
-- Password hash corresponds to 'Admin@AssetFlow2026' (argon2/bcrypt hashed representation)
INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, department_id, is_active)
VALUES
    (
        'u1111111-1111-4111-8111-111111111111',
        'admin@assetflow.local',
        '$2b$12$e8gJ7.W88Ff46hH7bS93.u/K8f7/6F8L4L76B6J8L2nQ3q1L4X9aO',
        'System',
        'Admin',
        (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1),
        'd1111111-1111-4111-8111-111111111111',
        TRUE
    ),
    (
        'u2222222-2222-4222-8222-222222222222',
        'manager@assetflow.local',
        '$2b$12$e8gJ7.W88Ff46hH7bS93.u/K8f7/6F8L4L76B6J8L2nQ3q1L4X9aO',
        'Elena',
        'Vance',
        (SELECT id FROM roles WHERE name = 'Asset Manager' LIMIT 1),
        'd2222222-2222-4222-8222-222222222222',
        TRUE
    ),
    (
        'u3333333-3333-4333-8333-333333333333',
        'employee@assetflow.local',
        '$2b$12$e8gJ7.W88Ff46hH7bS93.u/K8f7/6F8L4L76B6J8L2nQ3q1L4X9aO',
        'Marcus',
        'Chen',
        (SELECT id FROM roles WHERE name = 'Employee' LIMIT 1),
        'd3333333-3333-4333-8333-333333333333',
        TRUE
    )
ON CONFLICT (email) DO NOTHING;

-- Assign managers to departments
UPDATE departments SET manager_id = 'u1111111-1111-4111-8111-111111111111' WHERE code = 'CORP-HQ';
UPDATE departments SET manager_id = 'u2222222-2222-4222-8222-222222222222' WHERE code = 'IT-GLOBAL';

-- ============================================================================
-- 3. SEED ASSET CATEGORIES & INITIAL DEMO ASSETS
-- Demonstrates initial state machine transitions and bookable resources
-- ============================================================================

INSERT INTO assets (
    id, asset_tag, name, category, status, department_id, current_assignee_id,
    serial_number, manufacturer, model, purchase_date, purchase_cost, location, is_bookable
)
VALUES
    -- Category 1: High-Performance IT Workstations (Allocated State)
    (
        'a1111111-1111-4111-8111-111111111111',
        'AST-2026-0010',
        'MacBook Pro 16" M3 Max (64GB RAM)',
        'IT Workstations',
        'Allocated',
        'd2222222-2222-4222-8222-222222222222',
        'u2222222-2222-4222-8222-222222222222',
        'FVF12345M3MX',
        'Apple',
        'MacBook Pro 16 (A2991)',
        '2026-01-15',
        3899.00,
        'HQ - Server Room A / Rack 4',
        FALSE
    ),
    -- Category 2: Shared Conference & A/V Equipment (Bookable & Available State)
    (
        'a2222222-2222-4222-8222-222222222222',
        'AST-2026-0020',
        'Sony FX6 Cinema Camera Package + 24-70mm GM Lens',
        'Production Equipment',
        'Available',
        'd3333333-3333-4333-8333-333333333333',
        NULL,
        'SNY998877FX6',
        'Sony',
        'FX6 Professional Digital Cinema Camera',
        '2026-03-10',
        6499.00,
        'Studio B - Gear Locker #2',
        TRUE
    ),
    -- Category 3: Facilities Infrastructure (Under Maintenance State)
    (
        'a3333333-3333-4333-8333-333333333333',
        'AST-2026-0030',
        'APC Symmetra LX 16kVA N+1 Redundant UPS System',
        'Power Infrastructure',
        'Under Maintenance',
        'd2222222-2222-4222-8222-222222222222',
        NULL,
        'APC554433SYM',
        'Schneider Electric / APC',
        'SYA16K16PMR',
        '2024-11-20',
        14500.00,
        'HQ - Basement Power Room',
        FALSE
    ),
    -- Category 4: High-Density Projector (Available for Booking)
    (
        'a4444444-4444-4444-8444-444444444444',
        'AST-2026-0040',
        'Epson Pro L1755UNL 15,000-Lumen Laser Projector',
        'A/V Equipment',
        'Available',
        'd1111111-1111-4111-8111-111111111111',
        NULL,
        'EPS112233PRO',
        'Epson',
        'Pro L1755UNL',
        '2025-06-01',
        18200.00,
        'Executive Boardroom 1',
        TRUE
    )
ON CONFLICT (asset_tag) DO UPDATE
SET status = EXCLUDED.status, location = EXCLUDED.location;

-- ============================================================================
-- 4. SEED DEMO RESOURCE BOOKINGS & MAINTENANCE HISTORY
-- ============================================================================

-- Create an upcoming confirmed booking for the Sony FX6 Camera
INSERT INTO bookings (resource_id, user_id, start_time, end_time, status, purpose)
VALUES (
    'a2222222-2222-4222-8222-222222222222',
    'u3333333-3333-4333-8333-333333333333',
    CURRENT_TIMESTAMP + INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '1 day 4 hours',
    'confirmed',
    'Product Launch Promotional Video Shoot - B-Roll Studio Capture'
);

-- Create active maintenance ticket for the APC UPS System
INSERT INTO maintenance_requests (
    asset_id, requested_by, acting_user_id, status, priority, issue_title, issue_description, estimated_cost
)
VALUES (
    'a3333333-3333-4333-8333-333333333333',
    'u2222222-2222-4222-8222-222222222222',
    'u1111111-1111-4111-8111-111111111111',
    'approved',
    'critical',
    'Annual Battery Module Replacement & Calibration',
    'Replacing 4x RBC140 battery cartridges after 18-month diagnostic warning.',
    1250.00
);

-- Refresh materialized views now that initial seed data exists
SELECT refresh_analytics_materialized_views();

COMMIT;
