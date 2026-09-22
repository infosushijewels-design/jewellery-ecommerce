"use client";

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import type { Database } from '@/lib/supabase/database.types';
import { useAdminAccess } from '@/components/admin/AdminAccessContext';
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  countPermissions,
  normalizePermissions,
  type PermissionAction,
  type PermissionMap,
  type PermissionModule,
} from '@/lib/permissions';
import {
  CHEVRON_BG,
  ConfirmDialog,
  Drawer,
  DrawerFooter,
  DrawerHeader,
  EmptyState,
  Field,
  FilterPills,
  IconButton,
  LoadingState,
  MigrationNotice,
  PageHeader,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  TableCard,
  formatDate,
  friendlyDbError,
  getInitials,
  inputClass,
  isMissingTableError,
} from '@/components/admin/AdminUI';

type StaffRole = Database['public']['Tables']['staff_roles']['Row'];
type StaffMember = { id: string; email: string; full_name: string | null; staff_role_id: string | null; created_at: string };
type Tab = 'roles' | 'members';

const MIGRATION = '010_staff_roles_and_settings.sql';
const SUPER_ADMIN_VALUE = '__super__';

const ACTION_LABEL: Record<PermissionAction, string> = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete' };

function permissionChips(perms: PermissionMap) {
  return PERMISSION_MODULES.filter((m) => perms[m.key]?.length).map((m) => ({
    key: m.key,
    text: `${m.label}: ${perms[m.key]!.map((a) => ACTION_LABEL[a]).join(', ')}`,
  }));
}

export default function AdminStaffPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const access = useAdminAccess();
  // Only Super Admins manage staff; roles can grant view-only access to this page
  const canCreate = access.isSuperAdmin;
  const canEdit = access.isSuperAdmin;
  const canDelete = access.isSuperAdmin;

  const [tab, setTab] = useState<Tab>('roles');
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Role editor
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePerms, setRolePerms] = useState<PermissionMap>({});
  const [savingRole, setSavingRole] = useState(false);
  const [deleteRole, setDeleteRole] = useState<StaffRole | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  // Member editor
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRoleValue, setMemberRoleValue] = useState('');
  const [savingMember, setSavingMember] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removeMember, setRemoveMember] = useState<StaffMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const supabase = createClient();
    try {
      const [rolesRes, membersRes] = await Promise.all([
        supabase.from('staff_roles').select('*').order('is_system', { ascending: false }).order('name'),
        supabase.from('profiles').select('id, email, full_name, staff_role_id, created_at').eq('role', 'admin').order('created_at'),
      ]);
      if (rolesRes.error) throw rolesRes.error;
      if (membersRes.error) throw membersRes.error;
      setRoles(rolesRes.data || []);
      setMembers(membersRes.data || []);
      setMissingTable(false);
      if (isRefresh) showToast('Staff & roles refreshed', 'success');
    } catch (err) {
      if (isMissingTableError(err) || /staff_role_id/.test((err as { message?: string })?.message || '')) setMissingTable(true);
      else showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const memberCountByRole = useMemo(() => {
    const map = new Map<string, number>();
    members.forEach((m) => {
      if (m.staff_role_id) map.set(m.staff_role_id, (map.get(m.staff_role_id) || 0) + 1);
    });
    return map;
  }, [members]);

  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return members.filter((m) => !q || m.email.toLowerCase().includes(q) || (m.full_name || '').toLowerCase().includes(q));
  }, [members, memberSearch]);

  // ---------------- Roles ----------------
  function openCreateRole() {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRolePerms({ dashboard: ['view'] });
    setRoleFormOpen(true);
  }

  function openEditRole(role: StaffRole) {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setRolePerms(normalizePermissions(role.permissions));
    setRoleFormOpen(true);
  }

  function togglePermission(module: PermissionModule, action: PermissionAction) {
    setRolePerms((prev) => {
      const current = new Set(prev[module] || []);
      if (current.has(action)) {
        current.delete(action);
        // Removing view removes everything else for that module
        if (action === 'view') current.clear();
      } else {
        current.add(action);
        current.add('view');
      }
      const mod = PERMISSION_MODULES.find((m) => m.key === module)!;
      const ordered = (mod.actions as readonly PermissionAction[]).filter((a) => current.has(a));
      return { ...prev, [module]: ordered };
    });
  }

  function toggleModuleAll(module: PermissionModule) {
    const mod = PERMISSION_MODULES.find((m) => m.key === module)!;
    setRolePerms((prev) => {
      const all = (prev[module]?.length || 0) === mod.actions.length;
      return { ...prev, [module]: all ? [] : [...mod.actions] };
    });
  }

  function toggleEverything() {
    const total = PERMISSION_MODULES.reduce((acc, m) => acc + m.actions.length, 0);
    const all = countPermissions(rolePerms) === total;
    setRolePerms(all ? {} : Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, [...m.actions]])));
  }

  async function saveRole(e: { preventDefault: () => void }) {
    e.preventDefault();
    const name = roleName.trim();
    if (!name) return;
    const perms = normalizePermissions(rolePerms);
    if (countPermissions(perms) === 0) {
      showToast('Give this role at least one permission', 'error');
      return;
    }
    const clash = roles.find((r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== editingRole?.id);
    if (clash) {
      showToast(`A role named "${clash.name}" already exists`, 'error');
      return;
    }

    setSavingRole(true);
    const supabase = createClient();
    try {
      if (editingRole) {
        const payload = editingRole.is_system
          ? { description: roleDescription.trim() || null, permissions: perms }
          : { name, description: roleDescription.trim() || null, permissions: perms };
        const { data, error } = await supabase.from('staff_roles').update(payload).eq('id', editingRole.id).select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('permission denied');
        showToast(`Role "${name}" updated`, 'success');
      } else {
        const { error } = await supabase.from('staff_roles').insert({ name, description: roleDescription.trim() || null, permissions: perms });
        if (error) throw error;
        showToast(`Role "${name}" created`, 'success');
      }
      setRoleFormOpen(false);
      loadData();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setSavingRole(false);
    }
  }

  async function confirmDeleteRole() {
    if (!deleteRole) return;
    setDeletingRole(true);
    try {
      const { data, error } = await createClient().from('staff_roles').delete().eq('id', deleteRole.id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      showToast(`Role "${deleteRole.name}" deleted`, 'success');
      setDeleteRole(null);
      loadData();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setDeletingRole(false);
    }
  }

  // ---------------- Members ----------------
  function openAddMember() {
    setMemberEmail('');
    setMemberRoleValue(roles.find((r) => !r.is_system)?.id || roles[0]?.id || SUPER_ADMIN_VALUE);
    setMemberFormOpen(true);
  }

  async function assignMember(profileId: string, roleValue: string) {
    const staff_role_id = roleValue === SUPER_ADMIN_VALUE ? null : roleValue;
    const { data, error } = await createClient()
      .from('profiles')
      .update({ role: 'admin', staff_role_id })
      .eq('id', profileId)
      .select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('permission denied');
  }

  async function saveMember(e: { preventDefault: () => void }) {
    e.preventDefault();
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    if (memberRoleValue === SUPER_ADMIN_VALUE && !access.isSuperAdmin) {
      showToast('Only a Super Admin can grant Super Admin access', 'error');
      return;
    }
    setSavingMember(true);
    try {
      const { data: profile, error } = await createClient()
        .from('profiles')
        .select('id, email, role')
        .ilike('email', email)
        .maybeSingle();
      if (error) throw error;
      if (!profile) {
        showToast('No account found with that email. Ask them to sign up on the store first.', 'error');
        return;
      }
      if (profile.id === user?.id) {
        showToast('You cannot change your own access', 'error');
        return;
      }
      await assignMember(profile.id, memberRoleValue);
      showToast(`${profile.email} now has admin access`, 'success');
      setMemberFormOpen(false);
      loadData();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setSavingMember(false);
    }
  }

  async function changeMemberRole(member: StaffMember, roleValue: string) {
    if (roleValue === SUPER_ADMIN_VALUE && !access.isSuperAdmin) {
      showToast('Only a Super Admin can grant Super Admin access', 'error');
      return;
    }
    setUpdatingMemberId(member.id);
    try {
      await assignMember(member.id, roleValue);
      const staff_role_id = roleValue === SUPER_ADMIN_VALUE ? null : roleValue;
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, staff_role_id } : m)));
      showToast(`Role updated for ${member.email}`, 'success');
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function confirmRemoveMember() {
    if (!removeMember) return;
    setRemovingMember(true);
    try {
      const { data, error } = await createClient()
        .from('profiles')
        .update({ role: 'customer', staff_role_id: null })
        .eq('id', removeMember.id)
        .select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('permission denied');
      showToast(`${removeMember.email} no longer has admin access`, 'success');
      setRemoveMember(null);
      loadData();
    } catch (err) {
      showToast(friendlyDbError(err, MIGRATION), 'error');
    } finally {
      setRemovingMember(false);
    }
  }

  const superAdminCount = members.filter((m) => !m.staff_role_id).length;
  const roleOptions = [
    ...(access.isSuperAdmin ? [{ value: SUPER_ADMIN_VALUE, label: 'Super Admin (full access)' }] : []),
    ...roles.map((r) => ({ value: r.id, label: r.name })),
  ];
  const totalPossible = PERMISSION_MODULES.reduce((acc, m) => acc + m.actions.length, 0);

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">

      <PageHeader
        eyebrow="System"
        title="Staff & Roles"
        subtitle="Manage custom user roles and configure modular access control."
        actions={
          <>
            <SecondaryButton icon="refresh" spinning={refreshing} onClick={() => loadData(true)} disabled={refreshing || loading}>
              Refresh
            </SecondaryButton>
            {tab === 'roles' ? (
              canCreate && (
                <PrimaryButton icon="add" onClick={openCreateRole} disabled={missingTable}>
                  Create Custom Role
                </PrimaryButton>
              )
            ) : (
              canEdit && (
                <PrimaryButton icon="person_add" onClick={openAddMember} disabled={missingTable}>
                  Add Staff Member
                </PrimaryButton>
              )
            )}
          </>
        }
      />

      <MigrationNotice migration={MIGRATION} show={missingTable} />

      <FilterPills
        tabs={[
          { key: 'roles' as Tab, label: 'Roles' },
          { key: 'members' as Tab, label: 'Staff Members' },
        ]}
        active={tab}
        counts={{ roles: roles.length, members: members.length }}
        onChange={setTab}
      />

      {loading ? (
        <TableCard>
          <LoadingState label="Loading staff & roles..." />
        </TableCard>
      ) : tab === 'roles' ? (
        roles.length === 0 ? (
          <TableCard>
            <EmptyState icon="badge" title="No roles yet." hint={missingTable ? undefined : 'Create a custom role to give staff limited access.'} />
          </TableCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Super Admin (implicit) */}
            <div className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-5 shadow-[0_2px_10px_rgba(45,32,36,0.05)] flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-headline-sm text-lg text-[#2D2024] uppercase tracking-wide">Super Admin</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#4B2949]/10 text-[#4B2949] border border-[#4B2949]/20">Owner</span>
              </div>
              <p className="text-sm text-[#2D2024]/65 mt-1">Unrestricted access to every section, including Staff & Roles.</p>
              <div className="flex items-center gap-3 mt-4 py-3 border-y border-[#E8D5C5]/70">
                <span className="material-symbols-outlined text-[#8A6F3C]">group</span>
                <div className="text-sm">
                  <p className="text-[11px] text-[#2D2024]/55">Assigned Staff</p>
                  <p className="text-[#2D2024] font-medium">{superAdminCount} member(s)</p>
                </div>
              </div>
              <p className="text-xs text-[#2D2024]/55 mt-4">Admins without a staff role are Super Admins. Built in — cannot be edited.</p>
            </div>

            {roles.map((role) => {
              const perms = normalizePermissions(role.permissions);
              const chips = permissionChips(perms);
              const count = memberCountByRole.get(role.id) || 0;
              return (
                <div key={role.id} className="bg-[#FFFCF7] border border-[#E8D5C5] rounded-2xl p-5 shadow-[0_2px_10px_rgba(45,32,36,0.05)] flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-headline-sm text-lg text-[#2D2024] uppercase tracking-wide truncate">{role.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        role.is_system ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-[#B99A62]/12 text-[#8A6F3C] border-[#B99A62]/30'
                      }`}
                    >
                      {role.is_system ? 'System Role' : 'Custom Role'}
                    </span>
                  </div>
                  <p className="text-sm text-[#2D2024]/65 mt-1 line-clamp-2">{role.description || 'No description.'}</p>
                  <div className="flex items-center gap-3 mt-4 py-3 border-y border-[#E8D5C5]/70">
                    <span className="material-symbols-outlined text-[#8A6F3C]">group</span>
                    <div className="text-sm">
                      <p className="text-[11px] text-[#2D2024]/55">Assigned Staff</p>
                      <p className="text-[#2D2024] font-medium">{count} member(s)</p>
                    </div>
                    <span className="ml-auto text-[11px] text-[#2D2024]/55 tabular-nums">
                      {countPermissions(perms)}/{totalPossible} permissions
                    </span>
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-[#2D2024]/55 font-semibold mt-4 mb-2">Access Permissions</p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scroll pr-1">
                    {chips.length === 0 ? (
                      <span className="text-xs text-[#2D2024]/45">No permissions</span>
                    ) : (
                      chips.map((c) => (
                        <span key={c.key} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {c.text}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-auto pt-4">
                    {canDelete && !role.is_system && (
                      <IconButton
                        icon="delete"
                        title={count > 0 ? 'Reassign its staff before deleting' : 'Delete role'}
                        tone="danger"
                        onClick={() =>
                          count > 0
                            ? showToast(`Move the ${count} member(s) on "${role.name}" to another role first`, 'error')
                            : setDeleteRole(role)
                        }
                      />
                    )}
                    {canEdit && (
                      <button
                        onClick={() => openEditRole(role)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A6F3C] bg-[#B99A62]/10 hover:bg-[#B99A62]/20 px-3.5 py-2 rounded-full transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit Role
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
          <SearchInput value={memberSearch} onChange={setMemberSearch} placeholder="Search staff by name or email..." />
          <TableCard>
            {filteredMembers.length === 0 ? (
              <EmptyState icon="group_off" title={members.length ? 'No staff match your search.' : 'No staff members yet.'} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#E8D5C5] bg-[#F5EEE7]/60 text-[#2D2024]/60 uppercase tracking-wider text-[11px] font-semibold">
                      <th className="py-3.5 px-5">Staff Member</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Member Since</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D5C5]/70">
                    {filteredMembers.map((m) => {
                      const isSelf = m.id === user?.id;
                      const isSuper = !m.staff_role_id;
                      // Non-super admins may not modify Super Admins
                      const locked = isSelf || !canEdit || (isSuper && !access.isSuperAdmin);
                      return (
                        <tr key={m.id} className="hover:bg-[#F5EEE7]/50 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-[#B99A62]/15 text-[#8A6F3C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {getInitials(m.full_name || m.email)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[#2D2024] font-medium truncate max-w-[240px]">
                                  {m.full_name || m.email.split('@')[0]}
                                  {isSelf && <span className="ml-2 text-[10px] text-[#8A6F3C] font-semibold uppercase">You</span>}
                                </div>
                                <div className="text-xs text-[#2D2024]/55 truncate max-w-[240px]">{m.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {locked ? (
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  isSuper ? 'bg-[#4B2949]/10 text-[#4B2949] border-[#4B2949]/20' : 'bg-[#B99A62]/12 text-[#8A6F3C] border-[#B99A62]/30'
                                }`}
                              >
                                {isSuper ? 'Super Admin' : roleNameById.get(m.staff_role_id!) || 'Unknown role'}
                              </span>
                            ) : (
                              <select
                                value={m.staff_role_id || SUPER_ADMIN_VALUE}
                                disabled={updatingMemberId === m.id}
                                onChange={(e) => changeMemberRole(m, e.target.value)}
                                aria-label={`Role for ${m.email}`}
                                className="bg-white border border-[#E8D5C5] rounded-full pl-3.5 pr-8 py-1.5 text-xs font-semibold text-[#2D2024] focus:outline-none focus:border-[#B99A62] cursor-pointer appearance-none disabled:opacity-60 min-w-[160px]"
                                style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                              >
                                {roleOptions.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#2D2024]/70 whitespace-nowrap">{formatDate(m.created_at)}</td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-0.5">
                              <IconButton icon="mail" title="Email" href={`mailto:${m.email}`} />
                              {canDelete && !locked && (
                                <IconButton icon="person_remove" title="Remove admin access" tone="danger" onClick={() => setRemoveMember(m)} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TableCard>
        </>
      )}

      {/* Role editor */}
      <Drawer open={roleFormOpen} onClose={() => setRoleFormOpen(false)} widthClass="max-w-2xl">
        <form onSubmit={saveRole} className="flex flex-col min-h-full">
          <DrawerHeader
            eyebrow="Role"
            title={editingRole ? `Edit ${editingRole.name}` : 'Create Custom Role'}
            onClose={() => setRoleFormOpen(false)}
          />
          <div className="p-6 space-y-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Role Name *" htmlFor="role-name" hint={editingRole?.is_system ? 'System role names cannot be changed.' : undefined}>
                <input
                  id="role-name"
                  required
                  disabled={!!editingRole?.is_system}
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className={`${inputClass} disabled:bg-[#F5EEE7] disabled:text-[#2D2024]/50`}
                  placeholder="e.g. Order Manager"
                />
              </Field>
              <Field label="Description" htmlFor="role-desc">
                <input
                  id="role-desc"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className={inputClass}
                  placeholder="What this role is for"
                />
              </Field>
            </div>

            <div className="bg-white border border-[#E8D5C5] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8D5C5] bg-[#F5EEE7]/50">
                <p className="text-[11px] uppercase tracking-wider text-[#2D2024]/60 font-semibold">
                  Module Permissions · {countPermissions(rolePerms)}/{totalPossible}
                </p>
                <button type="button" onClick={toggleEverything} className="text-xs font-semibold text-[#8A6F3C] hover:underline">
                  {countPermissions(rolePerms) === totalPossible ? 'Clear all' : 'Select all'}
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#2D2024]/55">
                    <th className="text-left font-semibold py-2.5 px-4">Module</th>
                    {PERMISSION_ACTIONS.map((a) => (
                      <th key={a} className="font-semibold py-2.5 px-2 text-center w-16">{ACTION_LABEL[a]}</th>
                    ))}
                    <th className="font-semibold py-2.5 px-3 text-center w-14">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D5C5]/60">
                  {PERMISSION_MODULES.map((mod) => {
                    const granted = rolePerms[mod.key] || [];
                    const allOn = granted.length === mod.actions.length;
                    return (
                      <tr key={mod.key} className="hover:bg-[#F5EEE7]/40">
                        <td className="py-2.5 px-4 text-[#2D2024]">{mod.label}</td>
                        {PERMISSION_ACTIONS.map((action) => {
                          const supported = (mod.actions as readonly PermissionAction[]).includes(action);
                          return (
                            <td key={action} className="py-2.5 px-2 text-center">
                              {supported ? (
                                <input
                                  type="checkbox"
                                  checked={granted.includes(action)}
                                  onChange={() => togglePermission(mod.key, action)}
                                  aria-label={`${mod.label}: ${ACTION_LABEL[action]}`}
                                  className="w-4 h-4 accent-[#B99A62] cursor-pointer"
                                />
                              ) : (
                                <span className="text-[#2D2024]/25">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={allOn}
                            onChange={() => toggleModuleAll(mod.key)}
                            aria-label={`All ${mod.label} permissions`}
                            className="w-4 h-4 accent-[#2D2024] cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#2D2024]/55">
              Granting Create, Edit or Delete automatically grants View. Staff only see the sections their role can view.
            </p>
          </div>
          <DrawerFooter>
            <SecondaryButton onClick={() => setRoleFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" icon={savingRole ? undefined : 'save'} disabled={savingRole}>
              {savingRole ? 'Saving…' : editingRole ? 'Update Role' : 'Create Role'}
            </PrimaryButton>
          </DrawerFooter>
        </form>
      </Drawer>

      {/* Add staff member */}
      <Drawer open={memberFormOpen} onClose={() => setMemberFormOpen(false)} widthClass="max-w-md">
        <form onSubmit={saveMember} className="flex flex-col min-h-full">
          <DrawerHeader eyebrow="Staff" title="Add Staff Member" onClose={() => setMemberFormOpen(false)} />
          <div className="p-6 space-y-5 flex-1">
            <Field label="Account Email *" htmlFor="member-email" hint="The person must already have a customer account on the store (they can sign up at /signup).">
              <input
                id="member-email"
                type="email"
                required
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className={inputClass}
                placeholder="staff@example.com"
              />
            </Field>
            <Field label="Role *" htmlFor="member-role">
              <select
                id="member-role"
                value={memberRoleValue}
                onChange={(e) => setMemberRoleValue(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
                style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-xs">
              They will be able to sign in at <span className="font-mono">/admin/login</span> with their existing password.
            </div>
          </div>
          <DrawerFooter>
            <SecondaryButton onClick={() => setMemberFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" icon={savingMember ? undefined : 'person_add'} disabled={savingMember}>
              {savingMember ? 'Adding…' : 'Grant Access'}
            </PrimaryButton>
          </DrawerFooter>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteRole}
        title="Delete role?"
        message={
          <>
            <strong>{deleteRole?.name}</strong> will be permanently deleted.
          </>
        }
        confirmLabel="Yes, Delete"
        busy={deletingRole}
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeleteRole(null)}
      />

      <ConfirmDialog
        open={!!removeMember}
        title="Remove admin access?"
        message={<><strong>{removeMember?.email}</strong> will be changed back to a regular customer account.</>}
        confirmLabel="Remove Access"
        busy={removingMember}
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveMember(null)}
      />
    </div>
  );
}
