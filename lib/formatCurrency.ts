/** ₹ amount formatted en-IN, matching this project's existing display convention. Null/undefined/NaN → ₹0. */
export function formatCurrency(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  const n = Number(value ?? 0);
  return `₹${(Number.isFinite(n) ? n : 0).toLocaleString('en-IN', options)}`;
}
