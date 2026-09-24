"use client";

import { createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FULL_PERMISSIONS,
  hasPermission,
  normalizePermissions,
  type PermissionAction,
  type PermissionMap,
  type PermissionModule,
} from '@/lib/permissions';

export interface AdminAccess {
  /** Admin with no staff role assigned — full access, including Staff & Roles. */
  isSuperAdmin: boolean;
  roleName: string;
  permissions: PermissionMap;
  can: (module: PermissionModule, action?: PermissionAction) => boolean;
}

export function buildAccess(isSuperAdmin: boolean, roleName: string, permissions: PermissionMap): AdminAccess {
  return {
    isSuperAdmin,
    roleName,
    permissions,
    can: (module, action = 'view') => isSuperAdmin || hasPermission(permissions, module, action),
  };
}

export const SUPER_ADMIN_ACCESS = buildAccess(true, 'Admin', FULL_PERMISSIONS);

/**
 * Resolves the signed-in admin's staff role. Falls back to full access when the
 * staff tables don't exist yet (migration 010 not applied) so the panel never
 * locks out its owner.
 */
export async function loadAdminAccess(userId: string | null): Promise<AdminAccess> {
  if (!userId) return SUPER_ADMIN_ACCESS; // demo admin session
  const supabase = createClient();
  try {
    const { data: profile, error } = await supabase.from('profiles').select('staff_role_id').eq('id', userId).maybeSingle();
    if (error || !profile?.staff_role_id) return SUPER_ADMIN_ACCESS;

    const { data: role, error: roleError } = await supabase
      .from('staff_roles')
      .select('name, permissions')
      .eq('id', profile.staff_role_id)
      .maybeSingle();
    // A staff member whose role can't be read gets no module access rather than everything
    if (roleError || !role) return buildAccess(false, 'Staff', {});
    return buildAccess(false, role.name, normalizePermissions(role.permissions));
  } catch {
    return SUPER_ADMIN_ACCESS;
  }
}

const AdminAccessContext = createContext<AdminAccess>(SUPER_ADMIN_ACCESS);

export const AdminAccessProvider = AdminAccessContext.Provider;

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}
