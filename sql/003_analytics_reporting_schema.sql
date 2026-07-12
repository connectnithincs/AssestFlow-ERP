-- ============================================================================
-- ASSETFLOW ENTERPRISE ASSET & RESOURCE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Module 3: Analytics & Operational Reporting)
-- Architecture: Fast Dashboard Materialized Views, Window-Function Analytics,
--               Booking Heatmaps, and Predictive Retirement Logic.
-- ============================================================================

-- ============================================================================
-- 1. MATERIALIZED VIEWS & DASHBOARD EFFICIENCY ENGINE
-- ============================================================================
-- To ensure sub-15ms response times on dashboard queries even when `asset_history`
-- scales beyond 10+ million rows, we avoid calculating raw interval diffs (`LEAD(created_at)`)
-- across the entire historical table on every page load.
-- Instead, we maintain two materialized structures:
--   1. `mv_asset_status_summary`: Live/Near-Live snapshot of current asset counters.
--   2. `mv_daily_asset_durations`: Pre-aggregated daily time-in-state ledger.
-- ============================================================================

CREATE MATERIALIZED VIEW mv_asset_status_summary AS
SELECT 
    COUNT(*) AS total_assets,
    COUNT(*) FILTER (WHERE status = 'Available') AS count_available,
    COUNT(*) FILTER (WHERE status = 'Allocated') AS count_allocated,
    COUNT(*) FILTER (WHERE status = 'Reserved') AS count_reserved,
    COUNT(*) FILTER (WHERE status = 'Under Maintenance') AS count_under_maintenance,
    COUNT(*) FILTER (WHERE status = 'Lost') AS count_lost,
    COUNT(*) FILTER (WHERE status = 'Retired') AS count_retired,
    COUNT(*) FILTER (WHERE status = 'Disposed') AS count_disposed,
    
    -- Overdue Check: Bookings that are 'confirmed' whose end_time has passed
    (SELECT COUNT(*) 
     FROM bookings 
     WHERE status = 'confirmed' AND end_time < CURRENT_TIMESTAMP) AS count_overdue_bookings,
     
    -- Overdue Check: Assets under maintenance for > 14 days without completion
    COUNT(*) FILTER (
        WHERE status = 'Under Maintenance' 
          AND updated_at < CURRENT_TIMESTAMP - INTERVAL '14 days'
    ) AS count_overdue_maintenance
FROM assets;

-- Unique index required to enable zero-downtime `REFRESH MATERIALIZED VIEW CONCURRENTLY`
CREATE UNIQUE INDEX idx_mv_asset_status_summary_single_row ON mv_asset_status_summary ((TRUE));

-- ============================================================================
-- 2. DAILY TIME-IN-STATE MATERIALIZED VIEW (For Most-Used vs. Idle Analytics)
-- ============================================================================
-- Pre-aggregates historical transition intervals daily by asset_id and status.
-- This reduces a 10,000,000 row raw transition query into a compact, indexed table.
-- ============================================================================

CREATE MATERIALIZED VIEW mv_daily_asset_durations AS
WITH transition_intervals AS (
    SELECT 
        asset_id,
        new_status AS status,
        created_at AS transition_start,
        COALESCE(
            LEAD(created_at) OVER (PARTITION BY asset_id ORDER BY created_at),
            CURRENT_TIMESTAMP
        ) AS transition_end
    FROM asset_history
)
SELECT 
    asset_id,
    status,
    DATE_TRUNC('day', transition_start)::DATE AS duration_date,
    SUM(EXTRACT(EPOCH FROM (transition_end - transition_start)) / 3600.0) AS total_hours_in_state
FROM transition_intervals
GROUP BY asset_id, status, DATE_TRUNC('day', transition_start)::DATE;

CREATE UNIQUE INDEX idx_mv_daily_asset_durations_unique 
    ON mv_daily_asset_durations (asset_id, status, duration_date);
CREATE INDEX idx_mv_daily_asset_durations_date 
    ON mv_daily_asset_durations (duration_date, status);

-- ============================================================================
-- 3. VIEWS & PREPARED ANALYTICAL QUERIES
-- ============================================================================

-- View: Most-Used vs. Idle Assets over the last 30 Days
CREATE OR REPLACE VIEW v_asset_utilization_30_days AS
WITH usage_summary AS (
    SELECT 
        a.id AS asset_id,
        a.asset_tag,
        a.name,
        a.category,
        a.status AS current_status,
        COALESCE(SUM(d.total_hours_in_state) FILTER (WHERE d.status = 'Allocated'), 0) AS hours_allocated,
        COALESCE(SUM(d.total_hours_in_state) FILTER (WHERE d.status = 'Available'), 0) AS hours_idle,
        COALESCE(SUM(d.total_hours_in_state), 1) AS total_tracked_hours
    FROM assets a
    LEFT JOIN mv_daily_asset_durations d 
           ON d.asset_id = a.id 
          AND d.duration_date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE a.status NOT IN ('Retired', 'Disposed')
    GROUP BY a.id, a.asset_tag, a.name, a.category, a.status
)
SELECT 
    asset_id,
    asset_tag,
    name,
    category,
    current_status,
    ROUND(hours_allocated::NUMERIC, 2) AS hours_allocated,
    ROUND(hours_idle::NUMERIC, 2) AS hours_idle,
    ROUND(((hours_allocated / total_tracked_hours) * 100)::NUMERIC, 2) AS utilization_percentage,
    CASE 
        WHEN (hours_allocated / total_tracked_hours) >= 0.75 THEN 'High Usage (Most-Used)'
        WHEN (hours_allocated / total_tracked_hours) <= 0.15 AND hours_idle >= 100 THEN 'Severely Idle'
        ELSE 'Normal Usage'
    END AS utilization_tier
FROM usage_summary
ORDER BY utilization_percentage DESC;

-- View: Frequency Heatmap by Resource Category & Day-of-Week/Hour-of-Day Slots
CREATE OR REPLACE VIEW v_booking_category_heatmap AS
WITH RECURSIVE booking_hours AS (
    -- Expand bookings into each individual hour slot they touch using generate_series
    SELECT 
        b.resource_id,
        generate_series(
            DATE_TRUNC('hour', b.start_time),
            DATE_TRUNC('hour', b.end_time - INTERVAL '1 minute'),
            INTERVAL '1 hour'
        ) AS slot_hour
    FROM bookings b
    WHERE b.status = 'confirmed'
      AND b.start_time >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
    a.category AS resource_category,
    TO_CHAR(bh.slot_hour, 'Day') AS day_of_week,
    EXTRACT(DOW FROM bh.slot_hour) AS day_index, -- 0=Sunday..6=Saturday for sorting
    EXTRACT(HOUR FROM bh.slot_hour) AS hour_of_day, -- 0..23
    COUNT(*) AS booking_density_count,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY a.category)), 2) AS category_heat_percentage
FROM booking_hours bh
JOIN assets a ON a.id = bh.resource_id
GROUP BY a.category, TO_CHAR(bh.slot_hour, 'Day'), EXTRACT(DOW FROM bh.slot_hour), EXTRACT(HOUR FROM bh.slot_hour)
ORDER BY a.category, day_index, hour_of_day;

-- View: Predictive Retirement Recommendations (High Maintenance & Cost Ratio)
CREATE OR REPLACE VIEW v_maintenance_retirement_insights AS
WITH repair_stats AS (
    SELECT 
        a.id AS asset_id,
        a.asset_tag,
        a.name,
        a.category,
        a.purchase_date,
        COALESCE(a.purchase_cost, 0) AS purchase_cost,
        COUNT(m.id) AS total_repairs_past_12_months,
        COALESCE(SUM(m.actual_cost), SUM(m.estimated_cost), 0) AS total_maintenance_spend,
        MAX(m.completed_at) AS last_repair_date
    FROM assets a
    JOIN maintenance_requests m ON m.asset_id = a.id
    WHERE m.created_at >= CURRENT_DATE - INTERVAL '12 months'
      AND m.status IN ('completed', 'approved', 'pending')
      AND a.status NOT IN ('Retired', 'Disposed')
    GROUP BY a.id, a.asset_tag, a.name, a.category, a.purchase_date, a.purchase_cost
)
SELECT 
    asset_id,
    asset_tag,
    name,
    category,
    purchase_date,
    purchase_cost,
    total_repairs_past_12_months,
    total_maintenance_spend,
    ROUND(
        CASE 
            WHEN purchase_cost > 0 THEN (total_maintenance_spend / purchase_cost) * 100
            ELSE 100.0
        END, 2
    ) AS maintenance_to_purchase_cost_ratio_pct,
    last_repair_date,
    -- Recommendation Logic Flag
    CASE 
        WHEN total_repairs_past_12_months >= 4 THEN TRUE
        WHEN purchase_cost > 0 AND (total_maintenance_spend / purchase_cost) >= 0.50 THEN TRUE
        WHEN (purchase_date IS NOT NULL AND purchase_date < CURRENT_DATE - INTERVAL '5 years' AND total_repairs_past_12_months >= 2) THEN TRUE
        ELSE FALSE
    END AS suggest_retirement,
    CASE 
        WHEN total_repairs_past_12_months >= 4 
             THEN CONCAT('High Repair Frequency: ', total_repairs_past_12_months, ' breakdowns inside 12 months.')
        WHEN purchase_cost > 0 AND (total_maintenance_spend / purchase_cost) >= 0.50 
             THEN CONCAT('Uneconomical Repair Spend: Total maintenance ($', total_maintenance_spend, ') exceeds 50% of initial asset cost ($', purchase_cost, ').')
        WHEN (purchase_date < CURRENT_DATE - INTERVAL '5 years' AND total_repairs_past_12_months >= 2)
             THEN 'End-of-Life Lifecycle Aging: Asset is > 5 years old with recurring failure cycles.'
        ELSE 'Healthy Asset Lifecycle'
    END AS retirement_justification
FROM repair_stats
ORDER BY suggest_retirement DESC, total_repairs_past_12_months DESC, maintenance_to_purchase_cost_ratio_pct DESC;

-- ============================================================================
-- 4. MATERIALIZED VIEW CONCURRENT REFRESH PROCEDURE (To be scheduled)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_analytics_materialized_views()
RETURNS void AS $$
BEGIN
    -- CONCURRENTLY allows live SELECT queries on views while refresh happens
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_asset_status_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_asset_durations;
END;
$$ LANGUAGE plpgsql;
