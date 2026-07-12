-- ============================================================================
-- ASSETFLOW ENTERPRISE ASSET & RESOURCE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Module 4: 100% Specification & 10-Screen Alignment)
-- Covers: Asset Categories Master Table, Asset Allocations & Expected Returns,
--         Condition Check-Ins, Notifications Engine, and Activity Audit Logs.
-- ============================================================================

-- ============================================================================
-- 1. ENUM & DOMAIN UPDATES
-- ============================================================================

CREATE TYPE asset_condition AS ENUM (
    'New',
    'Good',
    'Fair',
    'Poor',
    'Damaged'
);

ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'technician_assigned';
ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'resolved';

-- ============================================================================
-- 2. MASTER DATA: ASSET CATEGORIES TABLE (Screen 3 - Tab B)
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., Electronics, Furniture, Vehicles, Production Equipment
    description TEXT,
    warranty_period_months INTEGER DEFAULT 12,
    custom_fields_schema JSONB DEFAULT '{}'::jsonb NOT NULL, -- Category-specific custom fields definition
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed core categories from specification
INSERT INTO asset_categories (name, description, warranty_period_months)
VALUES
    ('Electronics', 'Laptops, desktops, tablets, and mobile hardware', 36),
    ('Furniture', 'Office chairs, desks, ergonomic mounts, and boardroom fixtures', 60),
    ('Vehicles', 'Company transport, utility vans, and executive shuttles', 36),
    ('Production Equipment', 'Cinema cameras, lenses, lighting rigs, and audio recorders', 24),
    ('A/V Equipment', 'Projectors, PA systems, and smart conference boards', 24)
ON CONFLICT (name) DO NOTHING;

-- Link assets table to categories master table
ALTER TABLE assets
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES asset_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS condition asset_condition DEFAULT 'Good' NOT NULL,
    ADD COLUMN IF NOT EXISTS expected_return_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS document_urls JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Update assets table category_id mapping based on string name
UPDATE assets a
SET category_id = ac.id
FROM asset_categories ac
WHERE a.category = ac.name AND a.category_id IS NULL;

-- ============================================================================
-- 3. ASSET ALLOCATION LEDGER & CONFLICT RULES (Screen 5)
-- ============================================================================
-- Explicit table tracking every checkout/check-in with condition check notes
CREATE TABLE IF NOT EXISTS asset_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    allocated_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    allocated_to_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    allocated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    allocated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expected_return_date TIMESTAMPTZ,
    
    -- Return check-in data
    returned_at TIMESTAMPTZ,
    returned_condition asset_condition,
    return_checkin_notes TEXT,
    received_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    CONSTRAINT check_allocation_target CHECK (allocated_to_user_id IS NOT NULL OR allocated_to_department_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_allocations_asset_active ON asset_allocations(asset_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_allocations_user_active ON asset_allocations(allocated_to_user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_allocations_expected_return ON asset_allocations(expected_return_date) WHERE is_active = TRUE AND returned_at IS NULL;

-- ============================================================================
-- 4. MAINTENANCE AUTO-STATUS TRIGGER (Screen 7)
-- ============================================================================
-- Automatically flips asset status to 'Under Maintenance' on maintenance approval,
-- and flips back to 'Available' upon resolution.
CREATE OR REPLACE FUNCTION trigger_maintenance_status_automation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'approved' THEN
            UPDATE assets SET status = 'Under Maintenance' WHERE id = NEW.asset_id;
        ELSIF NEW.status IN ('resolved', 'completed') THEN
            UPDATE assets SET status = 'Available' WHERE id = NEW.asset_id AND status = 'Under Maintenance';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS automate_maintenance_asset_status ON maintenance_requests;
CREATE TRIGGER automate_maintenance_asset_status
    AFTER UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_maintenance_status_automation();

-- ============================================================================
-- 5. NOTIFICATIONS & ACTIVITY AUDIT LOGS (Screen 10)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'ASSET_ASSIGNED', 'MAINTENANCE_APPROVED', 'BOOKING_REMINDER', 'OVERDUE_ALERT', 'AUDIT_DISCREPANCY'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'REGISTER_ASSET', 'PROMOTE_USER', 'BOOK_RESOURCE', 'APPROVE_TRANSFER'
    module VARCHAR(50) NOT NULL,  -- 'ASSETS', 'USERS', 'BOOKINGS', 'MAINTENANCE', 'AUDITS'
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module);
