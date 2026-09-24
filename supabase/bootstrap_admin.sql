-- ==============================================================================
-- Bootstrap an admin account (run in Supabase Dashboard → SQL Editor)
-- ==============================================================================
-- The admin login screen no longer creates accounts, and profiles.role is
-- guarded by trg_guard_profile_privileges (migration 010) so it cannot be set
-- from the browser. The first admin must therefore be promoted here.
--
-- Steps:
--   1. Authentication → Users → "Add user" → enter the email + password and
--      tick "Auto Confirm User" (this project has email confirmation ON, so an
--      unconfirmed user can never sign in).
--   2. Replace the email below and run this file.
--   3. Sign in at /admin/login with that email + password.
-- ==============================================================================

UPDATE public.profiles
   SET role = 'admin'
 WHERE lower(email) = lower('REPLACE_WITH_YOUR_EMAIL@example.com');

-- If the UPDATE reports 0 rows, the profile row was never created by the
-- handle_new_user trigger. Create it from auth.users instead:
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), 'admin'
  FROM auth.users u
 WHERE lower(u.email) = lower('REPLACE_WITH_YOUR_EMAIL@example.com')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify
SELECT id, email, role FROM public.profiles WHERE role = 'admin';
