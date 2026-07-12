-- 007_auth_shim_and_grants.sql

-- 1. Setup Auth Schema & PostgREST JWT functions
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
$$ LANGUAGE sql STABLE;

-- 2. Create PostgREST standard roles if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'mysecretpassword';
  END IF;
END
$$;

-- Grant standard roles to authenticator so it can switch context
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;

-- 3. Grant schema usage and table access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Allow anonymous users to view available assets and active allocations if needed, 
-- but mostly we want authenticated users to have access.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow RPC execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 4. Set up materialized view refresh trigger
CREATE OR REPLACE FUNCTION fn_refresh_analytics_mvs_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if mv_daily_asset_durations exists before refreshing
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_daily_asset_durations') THEN
    PERFORM refresh_analytics_materialized_views();
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refresh_mvs_on_asset_change ON assets;
CREATE TRIGGER refresh_mvs_on_asset_change
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH STATEMENT EXECUTE FUNCTION fn_refresh_analytics_mvs_trigger();

DROP TRIGGER IF EXISTS refresh_mvs_on_alloc_change ON asset_allocations;
CREATE TRIGGER refresh_mvs_on_alloc_change
AFTER INSERT OR UPDATE OR DELETE ON asset_allocations
FOR EACH STATEMENT EXECUTE FUNCTION fn_refresh_analytics_mvs_trigger();
