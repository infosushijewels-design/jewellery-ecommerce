-- ==============================================================================
-- 027: Newsletter subscribers + spam protection for the contact form
--
--  * newsletter_subscribers   the footer "Join the Inner Circle" form used to say "Subscribed!" and keep nothing.
--                             Emails are now stored (one row per address, stored lower-case). Written only by the
--                             server (/api/newsletter); readable/editable/deletable by admins with the same
--                             permission as Contact Inquiries.
--  * ip_hash columns          a one-way hash of the visitor's IP address (never the address itself), used only to
--                             limit how many messages / sign-ups one visitor can send per hour.
--
-- Additive and safe to re-run (uses has_permission() from migration 025).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND char_length(email) <= 254),
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  source TEXT NOT NULL DEFAULT 'website_footer',
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_ip_created ON public.newsletter_subscribers (ip_hash, created_at);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.has_permission('inquiries', 'view'));

DROP POLICY IF EXISTS "Admins update newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins update newsletter subscribers"
  ON public.newsletter_subscribers FOR UPDATE
  USING (public.has_permission('inquiries', 'edit'));

DROP POLICY IF EXISTS "Admins delete newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins delete newsletter subscribers"
  ON public.newsletter_subscribers FOR DELETE
  USING (public.has_permission('inquiries', 'delete'));
-- No INSERT policy: only the server (service role) adds subscribers.

DROP TRIGGER IF EXISTS trg_newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER trg_newsletter_subscribers_updated_at BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Contact inquiries: remember a hash of who sent it (for rate limiting only).
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS ip_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_ip_created ON public.contact_inquiries (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email_created ON public.contact_inquiries (lower(email), created_at);
