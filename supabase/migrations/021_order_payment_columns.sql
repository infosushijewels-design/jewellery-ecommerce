-- ==============================================================================
-- 021: Order payment columns + protection of money/status columns
--
-- 1. Razorpay order/payment ids get their own columns (they used to be buried in the
--    free-text `notes`). Both are UNIQUE, so one payment can never be attached to two
--    orders, and one Razorpay order can never belong to two orders.
-- 2. A trigger stops a signed-in customer from editing an order's money or status
--    columns. The existing "claim guest orders" UPDATE rule lets a customer update ANY
--    column of an order that matches their email, so without this they could set
--    payment_status = 'paid' or lower the total on their own order. Only the user_id
--    claim (NULL -> their own id) stays allowed. Admins and the server (service role)
--    are unaffected.
--
-- Additive and safe to re-run. Apply BEFORE deploying the matching app code.
-- ==============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_razorpay_order_id
  ON public.orders (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_razorpay_payment_id
  ON public.orders (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

-- Orders paid before these columns existed carry the payment id inside `notes`; lift it out.
UPDATE public.orders
   SET razorpay_payment_id = substring(notes FROM 'Razorpay Payment ID: (pay_[A-Za-z0-9]+)'),
       paid_at = COALESCE(paid_at, created_at)
 WHERE razorpay_payment_id IS NULL
   AND payment_status = 'paid'
   AND notes ~ 'Razorpay Payment ID: pay_[A-Za-z0-9]+';

CREATE OR REPLACE FUNCTION public.guard_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is NULL for the service role and for internal/maintenance sessions; admins may edit freely.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.order_number IS DISTINCT FROM OLD.order_number
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.tax IS DISTINCT FROM OLD.tax
     OR NEW.shipping_fee IS DISTINCT FROM OLD.shipping_fee
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.shipping_address IS DISTINCT FROM OLD.shipping_address
     OR NEW.notes IS DISTINCT FROM OLD.notes
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
    RAISE EXCEPTION 'Only an administrator can change an order''s payment, totals or status.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_order_updates ON public.orders;
CREATE TRIGGER trg_guard_order_updates
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_updates();
