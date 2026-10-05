-- ==============================================================================
-- 028: Contact inquiries can only be created by the server
--
-- The contact form now posts to /api/contact, which validates the message, ignores bots (hidden field, too-fast
-- submissions), limits how many one visitor can send per hour and drops duplicates. While the old
-- "Anyone can submit an inquiry" rule exists, a bot can skip all of that and insert straight into the table, so it
-- is removed here.
--
-- !!  APPLY THIS ONLY AFTER the new app code (with /api/contact) is deployed to production.
-- !!  The previously deployed contact form inserts from the browser and would stop saving messages.
--
-- The service role bypasses RLS, so the app is unaffected. Safe to re-run.
-- ==============================================================================

DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON public.contact_inquiries;
