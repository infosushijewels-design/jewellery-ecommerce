/**
 * "Plan Your Wedding, With Love" — matching rules for the planner at /plan-your-wedding.
 *
 * The catalogue has no dedicated "jewellery type" or "gemstone" columns, so item and
 * style selections are matched the same way the search page already matches free text:
 * scoreProduct() against each product's title/material/badge plus its category name.
 * This reuses lib/catalogSearch.ts rather than adding new filter plumbing or a migration.
 */
import { scoreProduct } from './catalogSearch';
import type { PlannerProduct } from './supabase/queries';

export const BUDGET_OPTIONS = [
  { key: '10L', label: '₹10 Lakh' },
  { key: '20L', label: '₹20 Lakh' },
  { key: '50L', label: '₹50 Lakh' },
  { key: '1Cr', label: '₹1 Crore' },
] as const;
export type BudgetKey = (typeof BUDGET_OPTIONS)[number]['key'];

export const ITEM_OPTIONS = [
  { key: 'rings', label: 'Couple Rings', query: 'ring' },
  { key: 'mangalsutra', label: 'Mangalsutra', query: 'mangalsutra' },
  { key: 'pendant', label: 'Pendant Set', query: 'pendant' },
  { key: 'necklace', label: 'Necklace', query: 'necklace' },
] as const;
export type ItemKey = (typeof ITEM_OPTIONS)[number]['key'];

export const STYLE_OPTIONS = [
  { key: 'ruby', label: 'Ruby + Diamond', query: 'ruby diamond' },
  { key: 'emerald', label: 'Emerald + Diamond', query: 'emerald diamond' },
  { key: 'gold', label: 'Gold', query: 'gold' },
] as const;
export type StyleKey = (typeof STYLE_OPTIONS)[number]['key'];

/**
 * A product counts as "Price on Request" for the planner when either:
 *  - its price is not a usable number (<= 0 / missing) -- today this is every product in
 *    the catalogue, which is why the existing storefront (components/product/ProductCard.tsx)
 *    already hardcodes "Price on Request" for every listing; real prices simply haven't been
 *    entered yet, so 0 cannot be shown as if it were a real amount, or
 *  - an admin explicitly tags it via the existing Badge field in Admin -> Products
 *    (e.g. Badge: "Price on Request") -- no dedicated price-on-request column exists, so
 *    this needs no schema change. Once real prices are entered for a product (and its
 *    badge isn't "Price on Request"), it starts showing that real price automatically.
 */
export function isPriceOnRequest(product: Pick<PlannerProduct, 'badge' | 'price'>): boolean {
  if (!(product.price > 0)) return true;
  return !!product.badge && /price\s*on\s*request/i.test(product.badge);
}

export function matchesPlannerSelection(
  product: PlannerProduct,
  itemKeys: ItemKey[],
  styleKey: StyleKey | null
): boolean {
  if (itemKeys.length === 0) return false;
  const extra = product.categoryName ? [product.categoryName] : [];

  const itemMatch = itemKeys.some((key) => {
    const opt = ITEM_OPTIONS.find((o) => o.key === key);
    return !!opt && scoreProduct(product, opt.query, extra) > 0;
  });
  if (!itemMatch) return false;

  if (!styleKey) return true;
  const styleOpt = STYLE_OPTIONS.find((o) => o.key === styleKey);
  return !!styleOpt && scoreProduct(product, styleOpt.query, extra) > 0;
}

export function budgetLabel(key: BudgetKey | null): string | null {
  return key ? BUDGET_OPTIONS.find((b) => b.key === key)?.label ?? null : null;
}
