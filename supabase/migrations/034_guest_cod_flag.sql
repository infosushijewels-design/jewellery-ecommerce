-- ==============================================================================
-- 034: Feature flag "Allow COD for Guest Users"
--
-- Payment settings live in store_settings.settings -> 'payments' (codEnabled, onlineEnabled, codMaxOrderValue), edited
-- in Admin → Settings → Payments. This adds the guest switch next to them:
--
--     settings.payments.guestCodEnabled   boolean, default TRUE
--
-- TRUE  — guests (no account) can choose Cash on Delivery, exactly as today.
-- FALSE — guests must sign in to use COD; signed-in customers are never affected. Enforced on the checkout page AND
--         by the order API (lib/orderPricing.ts), so it cannot be bypassed.
--
-- Only fills the value in when it is missing, so an admin's choice is never overwritten. The app also treats a
-- missing value as TRUE, so this is safe to apply before or after deploying.
-- Safe to re-run. To undo: UPDATE store_settings SET settings = settings #- '{payments,guestCodEnabled}' WHERE id = 1;
-- ==============================================================================

UPDATE public.store_settings
SET settings = jsonb_set(
      CASE WHEN jsonb_typeof(settings -> 'payments') = 'object' THEN settings
           ELSE jsonb_set(settings, '{payments}', '{}'::jsonb, true) END,
      '{payments,guestCodEnabled}',
      'true'::jsonb,
      true)
WHERE id = 1
  AND (settings -> 'payments' -> 'guestCodEnabled') IS NULL;
