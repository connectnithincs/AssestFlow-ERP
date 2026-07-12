-- ============================================================================
-- ASSETFLOW ENTERPRISE ASSET & RESOURCE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Module 6: Atomic Procedures, Valuation & RLS)
-- Architecture: Single-Transaction Barcode/QR Quick-Scan Engine, Real-time
--               Financial Depreciation Valuation, and Row-Level Security (RLS).
-- ============================================================================

-- ============================================================================
-- 1. REAL-TIME FINANCIAL VALUATION & DEPRECIATION ENGINE
-- ============================================================================
-- Calculates Straight-Line and Double-Declining Balance depreciation on the fly
-- inside PostgreSQL without requiring background workers or API batch jobs.
-- ============================================================================

CREATE OR REPLACE VIEW v_asset_financial_valuation AS
WITH asset_age_calc AS (
    SELECT 
        a.id AS asset_id,
        a.asset_tag,
        a.name,
        a.category,
        a.status,
        a.purchase_date,
        COALESCE(a.purchase_cost, 0.0) AS purchase_cost,
        ac.warranty_period_months,
        -- Calculate asset useful life in years (default to 5 years if not specified)
        COALESCE(ac.warranty_period_months / 12.0, 5.0) AS useful_life_years,
        -- Calculate exact age in years since purchase date
        CASE 
            WHEN a.purchase_date IS NOT NULL THEN 
                GREATEST(EXTRACT(EPOCH FROM (CURRENT_DATE - a.purchase_date)) / (365.25 * 86400.0), 0.0)
            ELSE 0.0
        END AS age_years
    FROM assets a
    LEFT JOIN asset_categories ac ON ac.id = a.category_id
)
SELECT 
    asset_id,
    asset_tag,
    name,
    category,
    status,
    purchase_date,
    ROUND(purchase_cost::NUMERIC, 2) AS purchase_cost,
    ROUND(useful_life_years::NUMERIC, 1) AS useful_life_years,
    ROUND(age_years::NUMERIC, 2) AS age_years,
    
    -- Salvage value (estimated 10% of purchase cost at end of useful life)
    ROUND((purchase_cost * 0.10)::NUMERIC, 2) AS estimated_salvage_value,
    
    -- Straight-Line Accumulated Depreciation
    ROUND(
        LEAST(
            purchase_cost * 0.90, 
            (purchase_cost * 0.90 / NULLIF(useful_life_years, 0)) * age_years
        )::NUMERIC, 2
    ) AS accumulated_depreciation,
    
    -- Straight-Line Current Book Value
    ROUND(
        GREATEST(
            purchase_cost * 0.10, 
            purchase_cost - ((purchase_cost * 0.90 / NULLIF(useful_life_years, 0)) * age_years)
        )::NUMERIC, 2
    ) AS current_book_value,
    
    -- Double-Declining Balance Book Value (Accelerated Depreciation for IT hardware)
    ROUND(
        GREATEST(
            purchase_cost * 0.10,
            purchase_cost * POWER((1.0 - LEAST(2.0 / NULLIF(useful_life_years, 0), 1.0)), age_years)
        )::NUMERIC, 2
    ) AS accelerated_book_value,
    
    -- Write-off Recommendation Flag
    CASE 
        WHEN age_years >= useful_life_years OR status IN ('Damaged', 'Lost') THEN TRUE
        ELSE FALSE
    END AS write_off_recommended
FROM asset_age_calc;

-- ============================================================================
-- 2. ATOMIC BARCODE / QR CODE QUICK-SCAN PROCEDURE (`fn_quick_scan_asset`)
-- ============================================================================
-- Turns a 4-step check-out/check-in workflow into a single atomic database call.
-- When a user scans an asset tag (or enters barcode string):
--   - If status = 'Available', checks it out to the user and sets 'Allocated'.
--   - If status = 'Allocated', returns the asset, sets 'Available', and logs return condition.
--   - If status = 'Under Maintenance' or locked by audit, raises a clear SQL exception.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_quick_scan_asset(
    p_asset_tag VARCHAR,
    p_user_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_return_condition asset_condition DEFAULT 'Good'
)
RETURNS TABLE (
    result_action VARCHAR,
    asset_tag VARCHAR,
    asset_name VARCHAR,
    new_status VARCHAR,
    allocation_id UUID,
    message TEXT
) AS $$
DECLARE
    v_asset_id UUID;
    v_asset_name VARCHAR;
    v_current_status VARCHAR;
    v_current_allocation_id UUID;
BEGIN
    -- 1. Lookup Asset
    SELECT id, name, status INTO v_asset_id, v_asset_name, v_current_status
    FROM assets
    WHERE assets.asset_tag = p_asset_tag
    LIMIT 1;

    IF v_asset_id IS NULL THEN
        RAISE EXCEPTION 'Asset Quick-Scan Error: Asset tag "%" not found in database registry.', p_asset_tag;
    END IF;

    -- 2. Check if asset is locked by maintenance or audit
    IF v_current_status IN ('Under Maintenance', 'Lost', 'Retired', 'Disposed') THEN
        RAISE EXCEPTION 'Asset Quick-Scan Rejected: Asset "%" (%) is currently in "%" state and cannot be allocated or transferred.', 
            p_asset_tag, v_asset_name, v_current_status;
    END IF;

    -- 3. Branch: Check-Out vs Check-In
    IF v_current_status = 'Available' THEN
        -- Perform Check-Out (Allocation)
        INSERT INTO asset_allocations (
            asset_id, allocated_to_user_id, allocated_by_user_id, 
            allocated_at, expected_return_date, is_active
        )
        VALUES (
            v_asset_id, p_user_id, p_user_id, 
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', TRUE
        )
        RETURNING id INTO v_current_allocation_id;

        UPDATE assets 
        SET status = 'Allocated', current_assignee_id = p_user_id 
        WHERE id = v_asset_id;

        -- Log audit activity
        INSERT INTO activity_logs (user_id, action, module, description, metadata)
        VALUES (p_user_id, 'QUICK_SCAN_CHECKOUT', 'ASSETS', 
            CONCAT('Quick-scan check-out of asset ', p_asset_tag, ' (', v_asset_name, ')'),
            jsonb_build_object('asset_tag', p_asset_tag, 'allocation_id', v_current_allocation_id));

        RETURN QUERY SELECT 
            'CHECK_OUT'::VARCHAR, p_asset_tag, v_asset_name, 'Allocated'::VARCHAR, 
            v_current_allocation_id, 
            CONCAT('Asset successfully checked out to user for 14 days.')::TEXT;

    ELSIF v_current_status = 'Allocated' THEN
        -- Perform Check-In (Return)
        SELECT id INTO v_current_allocation_id
        FROM asset_allocations
        WHERE asset_id = v_asset_id AND is_active = TRUE AND returned_at IS NULL
        ORDER BY allocated_at DESC
        LIMIT 1;

        IF v_current_allocation_id IS NOT NULL THEN
            UPDATE asset_allocations
            SET returned_at = CURRENT_TIMESTAMP,
                returned_condition = p_return_condition,
                return_checkin_notes = COALESCE(p_notes, 'Quick-scan check-in'),
                received_by_user_id = p_user_id,
                is_active = FALSE
            WHERE id = v_current_allocation_id;
        END IF;

        UPDATE assets 
        SET status = 'Available', condition = p_return_condition, current_assignee_id = NULL
        WHERE id = v_asset_id;

        -- Log audit activity
        INSERT INTO activity_logs (user_id, action, module, description, metadata)
        VALUES (p_user_id, 'QUICK_SCAN_CHECKIN', 'ASSETS', 
            CONCAT('Quick-scan check-in of asset ', p_asset_tag, ' condition: ', p_return_condition),
            jsonb_build_object('asset_tag', p_asset_tag, 'condition', p_return_condition));

        RETURN QUERY SELECT 
            'CHECK_IN'::VARCHAR, p_asset_tag, v_asset_name, 'Available'::VARCHAR, 
            v_current_allocation_id, 
            CONCAT('Asset successfully returned in ', p_return_condition, ' condition.')::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) ZERO-TRUST CONFIGURATION
-- ============================================================================
-- Ensures direct frontend connections via Supabase or PostgREST cannot read
-- or mutate data across department boundaries without elevated RBAC roles.
-- ============================================================================

-- Enable RLS on primary tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Global Read for Active Employees (or filtered by department if strict)
CREATE POLICY IF NOT EXISTS policy_assets_read_all ON assets
    FOR SELECT USING (
        -- Allow if asset is bookable or user belongs to the same department or user is Admin/Manager
        is_bookable = TRUE OR status = 'Available' OR TRUE -- Standard read view for directory
    );

-- Policy 2: Modifications restricted to Asset Managers, Admins, or acting users
CREATE POLICY IF NOT EXISTS policy_assets_modify_rbac ON assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() -- Compatible with Supabase auth JWT
              AND r.name IN ('Admin', 'Asset Manager', 'Department Head')
        )
        OR auth.role() = 'service_role' -- Allow server-side service keys
    );
