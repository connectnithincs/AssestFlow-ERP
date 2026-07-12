-- ============================================================================
-- ASSETFLOW ENTERPRISE ASSET & RESOURCE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Module 2: Asset Audit & Verification)
-- Architecture: Multi-Auditor Verification Cycles, Snapshot-Based Auditing,
--               In-Progress State Locking, and Automated Discrepancy Reconciliation.
-- ============================================================================

-- ============================================================================
-- 1. ENUMERATIONS (Domain Types for Audit Module)
-- ============================================================================

CREATE TYPE audit_cycle_status AS ENUM (
    'Draft',
    'In-Progress',
    'Closed',
    'Cancelled'
);

CREATE TYPE audit_verification_status AS ENUM (
    'Pending',
    'Verified',
    'Missing',
    'Damaged'
);

-- ============================================================================
-- 2. AUDIT CYCLES & AUDIT RECORDS TABLES
-- ============================================================================

-- Audit Cycles Table: Manages the schedule, scope, and state of verification cycles
CREATE TABLE audit_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    department_scope UUID REFERENCES departments(id) ON DELETE SET NULL,
    location_scope VARCHAR(255), -- If scoped to a specific physical warehouse/room
    status audit_cycle_status NOT NULL DEFAULT 'Draft',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT check_audit_dates CHECK (end_date >= start_date)
);

-- Audit Records Table: Individual verification checklist items per asset in a cycle
CREATE TABLE audit_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_cycle_id UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    auditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Verification progress
    verification_status audit_verification_status NOT NULL DEFAULT 'Pending',
    notes TEXT,
    verified_at TIMESTAMPTZ,
    
    -- Baseline snapshots taken at the moment the cycle transitions to 'In-Progress'
    -- Essential for calculating variance even if assets change post-audit
    baseline_status asset_status NOT NULL,
    baseline_location VARCHAR(255),
    baseline_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    baseline_assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Prevent duplicate audit items for the same asset within a single audit cycle
    CONSTRAINT unique_asset_per_audit_cycle UNIQUE (audit_cycle_id, asset_id)
);

-- ============================================================================
-- 3. INDEXING STRATEGY (Optimization for Discrepancy Reports & Scope Checks)
-- ============================================================================

CREATE INDEX idx_audit_cycles_status ON audit_cycles(status);
CREATE INDEX idx_audit_cycles_department ON audit_cycles(department_scope);
CREATE INDEX idx_audit_cycles_dates ON audit_cycles(start_date, end_date);

-- Compound index for fast lookup of pending verification items per auditor
CREATE INDEX idx_audit_records_cycle_status ON audit_records(audit_cycle_id, verification_status);
CREATE INDEX idx_audit_records_asset_status ON audit_records(asset_id, verification_status);
CREATE INDEX idx_audit_records_auditor ON audit_records(auditor_id) WHERE auditor_id IS NOT NULL;

-- Partial index specifically tailored for State Locking verification (O(1) lookups)
CREATE INDEX idx_audit_records_active_lock 
    ON audit_records(asset_id) 
    WHERE verification_status != 'Verified';

-- ============================================================================
-- 4. STATE LOCKING ENGINE (Prevent Transfers & Maintenance During Audits)
-- ============================================================================

-- Function to prevent maintenance requests on unverified assets in an active audit
CREATE OR REPLACE FUNCTION check_asset_audit_lock()
RETURNS TRIGGER AS $$
DECLARE
    active_audit_title VARCHAR(255);
BEGIN
    -- Check if the asset is currently part of an 'In-Progress' audit cycle AND not yet verified
    SELECT ac.title INTO active_audit_title
    FROM audit_records ar
    JOIN audit_cycles ac ON ac.id = ar.audit_cycle_id
    WHERE ar.asset_id = NEW.asset_id
      AND ac.status = 'In-Progress'
      AND ar.verification_status != 'Verified'
    LIMIT 1;

    IF active_audit_title IS NOT NULL THEN
        RAISE EXCEPTION 'Asset State Lock Violation: Asset % is locked by active audit cycle "%". No maintenance requests or transfers can be initiated until the asset is verified (`verification_status = Verified`) or the audit cycle is closed.',
            NEW.asset_id, active_audit_title;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply state locking triggers to workflow tables
CREATE TRIGGER lock_transfer_requests_during_audit
    BEFORE INSERT ON transfer_requests
    FOR EACH ROW EXECUTE FUNCTION check_asset_audit_lock();

CREATE TRIGGER lock_maintenance_requests_during_audit
    BEFORE INSERT ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION check_asset_audit_lock();

-- Auto-update updated_at timestamps for new tables
CREATE TRIGGER set_updated_at_audit_cycles
    BEFORE UPDATE ON audit_cycles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_audit_records
    BEFORE UPDATE ON audit_records
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
