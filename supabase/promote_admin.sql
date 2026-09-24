-- ==============================================================================
-- Promote User to Super Admin
-- Run this in Supabase Dashboard -> SQL Editor
-- (https://supabase.com/dashboard/project/frlyjqyqbjxgorglvbdl/sql/new)
-- ==============================================================================

-- 1. Update profile role to 'admin' and ensure staff_role_id is NULL (Super Admin)
UPDATE public.profiles
   SET role = 'admin', staff_role_id = NULL
 WHERE lower(email) = lower('anjaliworksphere@gmail.com');

-- 2. If profile row doesn't exist yet, insert it directly from auth.users
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), 'admin'
  FROM auth.users u
 WHERE lower(u.email) = lower('anjaliworksphere@gmail.com')
ON CONFLICT (id) DO UPDATE SET role = 'admin', staff_role_id = NULL;

-- 3. Verify admin role status
SELECT id, email, role, staff_role_id FROM public.profiles WHERE role = 'admin';
