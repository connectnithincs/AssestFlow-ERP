-- ============================================================================
-- ASSETFLOW ENTERPRISE ASSET & RESOURCE MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Module 7: Auth Compatibility Shim & Grants DDL)
-- Architecture: Supabase Auth-Compatible Shim, Role Grants, and Materialized View Triggers.
-- ============================================================================

-- 1. Create auth schema if not exists
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Define auth.uid() and auth.role() compatibility shims
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS VARCHAR AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')::VARCHAR;
$$ LANGUAGE sql STABLE;

-- 3. Define standard PostgREST roles if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

-- 4. Schema Usage and Table Grants
-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

-- Grant Select permissions to both roles on all tables/views in public schema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant Insert, Update, Delete permissions to authenticated users on all tables/views in public schema
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on sequences for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant execution of functions to both roles
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;

-- 5. Materialized View Refresh Triggers (for assets & allocations)
CREATE OR REPLACE FUNCTION trigger_refresh_mv()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_analytics_materialized_views();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assets
CREATE OR REPLACE TRIGGER refresh_mv_assets
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_mv();

-- Trigger for asset_allocations
CREATE OR REPLACE TRIGGER refresh_mv_allocations
AFTER INSERT OR UPDATE OR DELETE ON asset_allocations
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_mv();
