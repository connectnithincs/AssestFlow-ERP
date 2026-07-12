-- ============================================================================
-- ASSETFLOW ENTERPRISE ASSET & RESOURCE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Core Modules)
-- Architecture: Role-Based Access Control (RBAC), State Machine Engine,
--               Exclusion-Based Resource Bookings, and Workflow Engine.
-- ============================================================================

-- Enable required extensions for advanced indexing & overlap prevention
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 1. ENUMERATIONS (Domain Types)
-- ============================================================================

CREATE TYPE asset_status AS ENUM (
    'Available',
    'Allocated',
    'Reserved',
    'Under Maintenance',
    'Lost',
    'Retired',
    'Disposed'
);

CREATE TYPE workflow_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'completed'
);

CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE booking_status AS ENUM (
    'confirmed',
    'cancelled',
    'completed'
);

-- ============================================================================
-- 2. RBAC SYSTEM (Roles, Permissions, Users, & Departments Hierarchy)
-- ============================================================================

-- Departments table with Parent-Child self-referencing relationship
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Roles table (e.g., Admin, Asset Manager, Dept. Head, Employee)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Granular permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'asset:create', 'booking:approve'
    name VARCHAR(150) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Junction table linking roles to permissions
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- Employees / Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add manager foreign key to departments now that users table exists
ALTER TABLE departments
    ADD COLUMN manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. STATE MACHINE ENGINE (Assets & Asset History)
-- ============================================================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status asset_status NOT NULL DEFAULT 'Available',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    current_assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    serial_number VARCHAR(150),
    manufacturer VARCHAR(150),
    model VARCHAR(150),
    purchase_date DATE,
    purchase_cost NUMERIC(12, 2) CHECK (purchase_cost >= 0),
    warranty_expiry_date DATE,
    location VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_bookable BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Audit table recording every asset state transition
CREATE TABLE asset_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    old_status asset_status,
    new_status asset_status NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    reference_type VARCHAR(50), -- e.g., 'MAINTENANCE_REQUEST', 'BOOKING', 'TRANSFER'
    reference_id UUID,          -- ID of the request/booking causing the transition
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 4. RESOURCE BOOKING (With Hard Overlap Conflict Prevention)
-- ============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status NOT NULL DEFAULT 'confirmed',
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Basic sanity check: end time must strictly follow start time
    CONSTRAINT check_booking_time_range CHECK (end_time > start_time),
    
    -- ========================================================================
    -- CONFLICT PREVENTION RULE: EXCLUSION CONSTRAINT
    -- Prevents overlapping confirmed bookings for the exact same resource_id
    -- at the database engine level (race-condition proof).
    -- Using half-open intervals '[)' so back-to-back bookings (e.g. 10-11 and 11-12)
    -- do not trigger a false conflict.
    -- ========================================================================
    CONSTRAINT exclude_overlapping_bookings
    EXCLUDE USING gist (
        resource_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    ) WHERE (status = 'confirmed')
);

-- ============================================================================
-- 5. WORKFLOW ENGINE (Maintenance & Transfer Requests)
-- ============================================================================

CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acting_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who approved/rejected/resolved
    status workflow_status NOT NULL DEFAULT 'pending',
    priority priority_level NOT NULL DEFAULT 'medium',
    issue_title VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    resolution_notes TEXT,
    estimated_cost NUMERIC(10, 2) CHECK (estimated_cost >= 0),
    actual_cost NUMERIC(10, 2) CHECK (actual_cost >= 0),
    acted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    target_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    source_assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    acting_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who approved/rejected
    status workflow_status NOT NULL DEFAULT 'pending',
    transfer_reason TEXT NOT NULL,
    rejection_reason TEXT,
    acted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- 6. INDEXING STRATEGY (Performance & Relational Integrity)
-- ============================================================================

-- Foreign Key Indexes (Essential for JOIN performance & avoiding lock contention)
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_manager ON departments(manager_id);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_manager ON users(manager_id);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_perm ON role_permissions(permission_id);

CREATE INDEX idx_assets_department ON assets(department_id);
CREATE INDEX idx_assets_assignee ON assets(current_assignee_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category ON assets(category);

CREATE INDEX idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX idx_asset_history_user ON asset_history(user_id);
CREATE INDEX idx_asset_history_created ON asset_history(created_at);
CREATE INDEX idx_asset_history_transitions ON asset_history(asset_id, old_status, new_status);

CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_time_range ON bookings USING gist (tstzrange(start_time, end_time, '[)'));

CREATE INDEX idx_maint_req_asset ON maintenance_requests(asset_id);
CREATE INDEX idx_maint_req_requested_by ON maintenance_requests(requested_by);
CREATE INDEX idx_maint_req_acting_user ON maintenance_requests(acting_user_id);
CREATE INDEX idx_maint_req_status ON maintenance_requests(status);

CREATE INDEX idx_transfer_req_asset ON transfer_requests(asset_id);
CREATE INDEX idx_transfer_req_requested_by ON transfer_requests(requested_by);
CREATE INDEX idx_transfer_req_acting_user ON transfer_requests(acting_user_id);
CREATE INDEX idx_transfer_req_status ON transfer_requests(status);
CREATE INDEX idx_transfer_req_target_dept ON transfer_requests(target_department_id);

-- ============================================================================
-- 7. STATE MACHINE GUARANTEES & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_departments
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_roles
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_assets
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_bookings
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_maintenance_requests
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_transfer_requests
    BEFORE UPDATE ON transfer_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- State Machine Validation Trigger: Prevent illegal transitions
CREATE OR REPLACE FUNCTION validate_asset_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Prevent transitions out of terminal states (Retired, Disposed) without explicit admin override/flag
        IF OLD.status IN ('Retired', 'Disposed') THEN
            RAISE EXCEPTION 'Invalid State Transition: Asset % is in a terminal state (%) and cannot transition to % without system recovery procedures.', 
                OLD.asset_tag, OLD.status, NEW.status;
        END IF;

        -- Prevent direct allocation if currently under maintenance (unless going back to Available first or handled via request)
        IF OLD.status = 'Under Maintenance' AND NEW.status IN ('Allocated', 'Reserved') THEN
            RAISE EXCEPTION 'Invalid State Transition: Asset % under maintenance must transition to Available before being Allocated or Reserved.',
                OLD.asset_tag;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_asset_state_machine
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION validate_asset_status_transition();

-- Automatic Audit Logging Trigger: Ensure every status transition is recorded inside asset_history
CREATE OR REPLACE FUNCTION log_asset_state_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO asset_history (
            asset_id,
            old_status,
            new_status,
            user_id,
            reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.current_assignee_id, OLD.current_assignee_id),
            'Status updated via automatic state transition trigger',
            jsonb_build_object('timestamp', CURRENT_TIMESTAMP, 'previous_assignee', OLD.current_assignee_id, 'new_assignee', NEW.current_assignee_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_asset_status_changes
    AFTER UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION log_asset_state_transition();

-- ============================================================================
-- 8. INITIAL DATA SEEDING (Core System Roles)
-- ============================================================================

INSERT INTO roles (name, description, is_system_role) VALUES
    ('Admin', 'Full administrative control over all modules, workflows, and RBAC settings.', TRUE),
    ('Asset Manager', 'Can manage asset lifecycle, approve maintenance/transfers, and audit inventory.', TRUE),
    ('Dept. Head', 'Can approve transfer requests and view department-level resource allocations.', TRUE),
    ('Employee', 'Can request resources, book bookable assets, and submit maintenance tickets.', TRUE)
ON CONFLICT (name) DO NOTHING;
