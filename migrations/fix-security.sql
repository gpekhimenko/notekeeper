-- Fix Supabase Security Advisor warnings
-- Since we connect via DATABASE_URL (postgres role), RLS policies
-- won't block our server-side queries, but enabling RLS prevents
-- access via the Supabase anon/service keys if ever exposed.

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Revoke public access to anon and authenticated roles
-- (our app uses the postgres role via DATABASE_URL, not these)
REVOKE ALL ON TABLE users FROM anon, authenticated;
REVOKE ALL ON TABLE accounts FROM anon, authenticated;
REVOKE ALL ON TABLE sessions FROM anon, authenticated;
REVOKE ALL ON TABLE verification_tokens FROM anon, authenticated;
REVOKE ALL ON TABLE notes FROM anon, authenticated;
REVOKE ALL ON TABLE user_settings FROM anon, authenticated;
