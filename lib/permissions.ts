/**
 * Admin permission model used by Staff & Roles.
 * A role's `permissions` JSON maps a module key to the actions it may perform,
 * e.g. { "orders": ["view", "edit"] }.
 */
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

export const PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', actions: ['view'] },
  { key: 'orders', label: 'Orders', href: '/admin/orders', actions: ['view', 'edit'] },
  { key: 'products', label: 'Products', href: '/admin/products', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'categories', label: 'Categories', href: '/admin/categories', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'customers', label: 'Customers', href: '/admin/customers', actions: ['view'] },
  { key: 'payments', label: 'Payments History', href: '/admin/payments', actions: ['view', 'edit'] },
  { key: 'stores', label: 'Stores', href: '/admin/stores', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'coupons', label: 'Coupons', href: '/admin/coupons', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'reviews', label: 'Reviews', href: '/admin/reviews', actions: ['view', 'edit', 'delete'] },
  { key: 'inquiries', label: 'Contact Inquiries', href: '/admin/inquiries', actions: ['view', 'edit', 'delete'] },
  { key: 'legal', label: 'Legal Pages', href: '/admin/legal', actions: ['view', 'create', 'edit', 'delete'] },
  // Managing staff is reserved for Super Admins (otherwise staff could escalate their own role), so roles can only grant view
  { key: 'staff', label: 'Staff & Roles', href: '/admin/staff', actions: ['view'] },
  { key: 'settings', label: 'Settings', href: '/admin/settings', actions: ['view', 'edit'] },
] as const satisfies readonly { key: string; label: string; href: string; actions: readonly PermissionAction[] }[];

export type PermissionModule = (typeof PERMISSION_MODULES)[number]['key'];
export type PermissionMap = Partial<Record<PermissionModule, PermissionAction[]>>;

/** Every permission — what a Super Admin (admin with no staff role) effectively has. */
export const FULL_PERMISSIONS: PermissionMap = Object.fromEntries(
  PERMISSION_MODULES.map((m) => [m.key, [...m.actions]])
) as PermissionMap;

/** Sanitises untrusted JSON from the database into a PermissionMap. */
export function normalizePermissions(raw: unknown): PermissionMap {
  const out: PermissionMap = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const mod of PERMISSION_MODULES) {
    const value = (raw as Record<string, unknown>)[mod.key];
    if (!Array.isArray(value)) continue;
    const allowed = (mod.actions as readonly string[]).filter((a) => value.includes(a)) as PermissionAction[];
    // Any other action implies view
    if (allowed.length && !allowed.includes('view')) allowed.unshift('view');
    if (allowed.length) out[mod.key] = allowed;
  }
  return out;
}

export function hasPermission(perms: PermissionMap, module: PermissionModule, action: PermissionAction = 'view') {
  return !!perms[module]?.includes(action);
}

/** Module a pathname belongs to, or null for routes without a permission gate. */
export function moduleForPath(pathname: string): PermissionModule | null {
  if (pathname === '/admin') return 'dashboard';
  const match = [...PERMISSION_MODULES]
    .filter((m) => m.href !== '/admin')
    .find((m) => pathname === m.href || pathname.startsWith(`${m.href}/`));
  return match?.key ?? null;
}

export function countPermissions(perms: PermissionMap) {
  return Object.values(perms).reduce((acc, actions) => acc + (actions?.length || 0), 0);
}
