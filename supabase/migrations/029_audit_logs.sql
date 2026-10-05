-- ==============================================================================
-- 029: Audit log — who created, changed or deleted what in the admin panel
--
-- Every create / update / delete of a product, category or order made by a signed-in admin is recorded by a
-- database trigger, so it cannot be skipped by a screen that forgets to log (or by calling the API directly).
-- Actions that happen on the server (refunds, bulk emails) are written by lib/audit.ts.
--
--   * Rows are written only by the triggers / the server (service role). Nobody can edit or delete them.
--   * Only admins with "Staff & Roles → view" (always the Super Admin) can read the log.
--   * Customer-driven changes (checkout, stock reductions made by a customer's order) are NOT logged:
--     only changes made while signed in as an admin are.
--   * Changed values are stored for simple fields only (never addresses or other JSON), long text is cut short.
--
-- Safe to re-run. To undo: DROP TABLE public.audit_logs CASCADE; DROP FUNCTION public.audit_row_change();
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 40),
  resource_type TEXT NOT NULL CHECK (char_length(resource_type) BETWEEN 1 AND 40),
  resource_id   TEXT,
  details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs (admin_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_permission('staff', 'view'));

-- No insert / update / delete policies: the log is append-only and written only by SECURITY DEFINER code below
-- and by the server's service role. (Belt and braces: also take the table privileges away.)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- Trigger function shared by products, categories and orders
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor   UUID := auth.uid();
  v_new     JSONB;
  v_old     JSONB;
  v_row     JSONB;
  v_changes JSONB := '{}'::jsonb;
  v_skipped JSONB := '[]'::jsonb;
  v_details JSONB;
  v_key     TEXT;
  v_label   TEXT;
BEGIN
  -- Only changes made by a signed-in admin are logged (not customers' checkouts, webhooks or cron jobs).
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN v_row := to_jsonb(OLD); ELSE v_row := to_jsonb(NEW); END IF;
  v_label := COALESCE(v_row ->> 'title', v_row ->> 'name', v_row ->> 'order_number');
  v_details := jsonb_build_object('label', left(v_label, 200));

  IF TG_OP = 'UPDATE' THEN
    v_new := to_jsonb(NEW);
    v_old := to_jsonb(OLD);
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      CONTINUE WHEN v_key = 'updated_at' OR (v_new -> v_key) IS NOT DISTINCT FROM (v_old -> v_key);
      IF jsonb_typeof(v_new -> v_key) IN ('object', 'array') OR jsonb_typeof(v_old -> v_key) IN ('object', 'array') THEN
        v_skipped := v_skipped || to_jsonb(v_key);     -- structured data (addresses, galleries…): note that it changed, not what
      ELSE
        v_changes := v_changes || jsonb_build_object(
          v_key, jsonb_build_object('from', left(v_old ->> v_key, 200), 'to', left(v_new ->> v_key, 200)));
      END IF;
    END LOOP;
    IF v_changes = '{}'::jsonb AND v_skipped = '[]'::jsonb THEN
      RETURN NULL;                                      -- nothing really changed
    END IF;
    v_details := v_details || jsonb_build_object('changes', v_changes);
    IF v_skipped <> '[]'::jsonb THEN
      v_details := v_details || jsonb_build_object('other_fields_changed', v_skipped);
    END IF;
  END IF;

  INSERT INTO public.audit_logs (admin_id, action, resource_type, resource_id, details)
  VALUES (
    v_actor,
    CASE TG_OP WHEN 'INSERT' THEN 'create' WHEN 'UPDATE' THEN 'update' ELSE 'delete' END,
    TG_ARGV[0],
    v_row ->> 'id',
    v_details
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_products ON public.products;
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change('product');

DROP TRIGGER IF EXISTS audit_categories ON public.categories;
CREATE TRIGGER audit_categories AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change('category');

DROP TRIGGER IF EXISTS audit_orders ON public.orders;
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change('order');
