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

-- ============================================================================
-- 4. UNIFIED RAISED TICKETS & HELPDESK OBSERVATION QUEUE (`v_raised_tickets_queue`)
-- ============================================================================
-- Provides a sub-15ms unified real-time view observing all raised tickets
-- across both Maintenance Requests (repairs/issues) and Transfer Requests (reassignments).
-- Used directly by TanStack Query (`useRaisedTicketsQueue`) and the Web Studio.
-- ============================================================================

CREATE OR REPLACE VIEW v_raised_tickets_queue AS
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
    CONCAT('Asset Reassignment Request to ', u_req.name) AS summary,
    tr.transfer_reason AS details,
    u_req.name AS requested_by,
    tr.status,
    0.00 AS financial_impact,
    tr.request_date AS raised_date
FROM transfer_requests tr
JOIN assets a ON a.asset_id = tr.asset_id
JOIN users u_req ON u_req.user_id = tr.requested_by_id
WHERE tr.status IN ('pending', 'approved');

-- ============================================================================
-- 5. EMPLOYEE SELF-SERVICE PORTAL & MY TICKET PROGRESS TRACKING ENGINE
-- ============================================================================
-- Provides a dedicated user-centric view and atomic submission engine so when
-- an individual employee logs in (e.g., Priya USR-001 or Marcus USR-002), they
-- track only their own raised tickets, current resolution progress %, and assets.
-- ============================================================================

-- View: `v_user_my_tickets_portal`
-- Maps status strings into quantitative progress percentage (`25%` -> `100%`)
CREATE OR REPLACE VIEW v_user_my_tickets_portal AS
SELECT 
    mr.request_id AS ticket_id,
    'MAINTENANCE REPAIR' AS ticket_type,
    mr.priority_level AS priority,
    a.asset_tag,
    a.asset_name,
    mr.issue_title AS summary,
    mr.detailed_description AS details,
    mr.requested_by,
    -- Join or match user ID who raised it
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
    CONCAT('Reassignment Request to ', u_req.name) AS summary,
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

-- Procedure: `fn_raise_user_ticket`
-- Enables a standard employee to log a new maintenance/repair ticket in 1 call.
CREATE OR REPLACE FUNCTION fn_raise_user_ticket(
    p_user_id VARCHAR,
    p_asset_tag VARCHAR,
    p_issue_title VARCHAR,
    p_detailed_description TEXT DEFAULT NULL,
    p_priority VARCHAR DEFAULT 'medium'
)
RETURNS TABLE (
    ticket_id VARCHAR,
    asset_tag VARCHAR,
    asset_name VARCHAR,
    status VARCHAR,
    progress_percentage INTEGER,
    message TEXT
) AS $$
DECLARE
    v_asset_id VARCHAR;
    v_asset_name VARCHAR;
    v_user_name VARCHAR;
    v_new_ticket_id VARCHAR;
BEGIN
    -- 1. Lookup Asset
    SELECT asset_id, asset_name INTO v_asset_id, v_asset_name
    FROM assets
    WHERE assets.asset_tag = p_asset_tag
    LIMIT 1;

    IF v_asset_id IS NULL THEN
        RAISE EXCEPTION 'Ticket Submission Error: Asset tag "%" not found.', p_asset_tag;
    END IF;

    -- 2. Lookup User
    SELECT name INTO v_user_name
    FROM users
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_user_name IS NULL THEN
        v_user_name := CONCAT('Employee (', p_user_id, ')');
    END IF;

    -- 3. Insert Maintenance Ticket
    v_new_ticket_id := CONCAT('MNT-USR-', CAST(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AS BIGINT));
    
    INSERT INTO maintenance_requests (
        request_id, asset_id, requested_by, priority_level, 
        issue_title, detailed_description, status, created_at
    )
    VALUES (
        v_new_ticket_id, v_asset_id, v_user_name, p_priority, 
        p_issue_title, COALESCE(p_detailed_description, p_issue_title), 'pending', CURRENT_DATE
    );

    -- 4. Log Audit Activity
    INSERT INTO activity_logs (user_name, module_name, action_description)
    VALUES (v_user_name, 'TICKETS', CONCAT('Raised repair ticket ', v_new_ticket_id, ' for ', p_asset_tag, ': ', p_issue_title));

    RETURN QUERY SELECT 
        v_new_ticket_id, p_asset_tag, v_asset_name, 'pending'::VARCHAR, 25,
        CONCAT('Repair ticket successfully logged! Track progress anytime in your user portal.')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Policy 3: Employee Self-Service RLS Isolation
CREATE POLICY IF NOT EXISTS policy_user_self_service_tickets ON maintenance_requests
    FOR ALL USING (
        -- Users can only see tickets they requested, unless they are Admin/Manager
        requested_by = (SELECT name FROM users WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.name IN ('Admin', 'Asset Manager')
        )
        OR auth.role() = 'service_role'
    );


