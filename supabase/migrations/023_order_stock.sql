-- ==============================================================================
-- 023: Stock is reduced when an order is placed, and returned when it is cancelled
--
-- Until now nothing lowered products.stock, so the same item could be sold again and again.
--
--  * reserve_order_stock(order_id)   takes the stock for an order's items in ONE transaction. Each product is
--                                    updated with "stock >= quantity", so two buyers can never both get the last
--                                    piece; if any item is short the whole reservation is rolled back
--                                    (error code P0001 "insufficient_stock").
--  * orders.stock_reserved           remembers that an order is holding stock, so it is released exactly once.
--  * trigger on orders.status        cancelling an order returns its stock; re-opening a cancelled order takes it
--                                    again (and fails if the stock is gone).
--  * trigger on DELETE               deleting an order that still holds stock returns it.
--  * cancel_stale_online_orders()    an online order that was never paid within N minutes is cancelled (and its
--                                    stock released), so abandoned checkouts don't lock stock.
--
-- The functions are callable only by the server (service role). Orders created before this migration never
-- reserved stock (stock_reserved = false), so cancelling or deleting them changes nothing.
-- Safe to re-run.
-- ==============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- Customers may only claim a guest order (user_id NULL -> theirs). Compare every other column generically so
-- columns added later (stock, tracking, refunds ...) are protected automatically.
-- ---------------------------------------------------------------------------
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

  IF (to_jsonb(NEW) - 'user_id' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'user_id' - 'updated_at') THEN
    RAISE EXCEPTION 'Only an administrator can change an order''s payment, totals or status.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Reserve the stock for an order's items (atomic).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_order_stock(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved BOOLEAN;
  r RECORD;
BEGIN
  SELECT stock_reserved INTO v_reserved FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id USING ERRCODE = 'P0002';
  END IF;
  IF v_reserved THEN
    RETURN; -- already holding its stock
  END IF;

  -- Lock products in a fixed order so two orders can't deadlock each other.
  FOR r IN
    SELECT product_id, SUM(quantity)::INT AS qty
      FROM public.order_items
     WHERE order_id = p_order_id AND product_id IS NOT NULL
     GROUP BY product_id
     ORDER BY product_id
  LOOP
    UPDATE public.products SET stock = stock - r.qty WHERE id = r.product_id AND stock >= r.qty;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = 'P0001', DETAIL = r.product_id::TEXT;
    END IF;
  END LOOP;

  UPDATE public.orders SET stock_reserved = TRUE WHERE id = p_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Cancelling returns the stock; re-opening a cancelled order takes it again.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.orders_stock_on_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND OLD.stock_reserved THEN
    UPDATE public.products p
       SET stock = p.stock + i.qty
      FROM (
        SELECT product_id, SUM(quantity)::INT AS qty
          FROM public.order_items
         WHERE order_id = OLD.id AND product_id IS NOT NULL
         GROUP BY product_id
      ) i
     WHERE p.id = i.product_id;
    NEW.stock_reserved := FALSE;

  ELSIF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' AND NOT OLD.stock_reserved
        AND EXISTS (SELECT 1 FROM public.order_items WHERE order_id = OLD.id AND product_id IS NOT NULL) THEN
    FOR r IN
      SELECT product_id, SUM(quantity)::INT AS qty
        FROM public.order_items
       WHERE order_id = OLD.id AND product_id IS NOT NULL
       GROUP BY product_id
       ORDER BY product_id
    LOOP
      UPDATE public.products SET stock = stock - r.qty WHERE id = r.product_id AND stock >= r.qty;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = 'P0001', DETAIL = r.product_id::TEXT;
      END IF;
    END LOOP;
    NEW.stock_reserved := TRUE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_stock_on_status ON public.orders;
CREATE TRIGGER trg_orders_stock_on_status
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_stock_on_status();

-- ---------------------------------------------------------------------------
-- Deleting an order that still holds stock returns it (items still exist at this point).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.orders_stock_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stock_reserved THEN
    UPDATE public.products p
       SET stock = p.stock + i.qty
      FROM (
        SELECT product_id, SUM(quantity)::INT AS qty
          FROM public.order_items
         WHERE order_id = OLD.id AND product_id IS NOT NULL
         GROUP BY product_id
      ) i
     WHERE p.id = i.product_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_stock_on_delete ON public.orders;
CREATE TRIGGER trg_orders_stock_on_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_stock_on_delete();

-- ---------------------------------------------------------------------------
-- Abandoned online checkouts: cancel (and release the stock of) orders never paid within N minutes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_stale_online_orders(p_minutes INT DEFAULT 60)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH stale AS (
    UPDATE public.orders
       SET status = 'cancelled', payment_status = 'failed'
     WHERE payment_method = 'online'
       AND payment_status = 'pending'
       AND status = 'placed'
       AND created_at < now() - make_interval(mins => p_minutes)
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM stale;
  RETURN v_count;
END;
$$;

-- Server-only: the browser must never be able to call these.
REVOKE ALL ON FUNCTION public.reserve_order_stock(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_stale_online_orders(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_order_stock(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_stale_online_orders(INT) TO service_role;
