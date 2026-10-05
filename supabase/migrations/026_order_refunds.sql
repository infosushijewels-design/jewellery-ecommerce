-- ==============================================================================
-- 026: Refunds
--
--  * orders.payment_status may now also be 'refunded' (everything returned) or 'partially_refunded'.
--  * orders.refunded_amount keeps the running total refunded for the order.
--  * order_refunds records every refund (amount, reason, who did it, Razorpay's refund id and status).
--    It is written only by the server (service role); admins with Orders access can read it.
--  * At most ONE refund per order can be "pending" at a time, so a double click or two admins acting together
--    can never refund the same money twice.
--
-- Additive and safe to re-run (needs has_permission() from migration 025, which runs first).
-- ==============================================================================

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.order_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT NOT NULL,
  razorpay_refund_id TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  -- our own state: pending = request in flight to Razorpay, processed = Razorpay accepted it, failed = it did not
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  -- Razorpay's own status for the refund (it may stay 'pending' for a few days until the bank settles it)
  razorpay_status TEXT,
  error TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (for databases where 025 was already applied before razorpay_status existed)
ALTER TABLE public.order_refunds ADD COLUMN IF NOT EXISTS razorpay_status TEXT;

CREATE INDEX IF NOT EXISTS idx_order_refunds_order_id ON public.order_refunds (order_id);

-- One in-flight refund per order.
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_refunds_one_pending
  ON public.order_refunds (order_id) WHERE status = 'pending';

ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read order refunds" ON public.order_refunds;
CREATE POLICY "Admins read order refunds"
  ON public.order_refunds FOR SELECT
  USING (public.has_permission('orders', 'view'));
-- No INSERT/UPDATE/DELETE policies: only the server (service role) records refunds.

DROP TRIGGER IF EXISTS trg_order_refunds_updated_at ON public.order_refunds;
CREATE TRIGGER trg_order_refunds_updated_at BEFORE UPDATE ON public.order_refunds
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
