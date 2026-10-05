import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/lib/supabase/database.types';

export type AuditAction = 'create' | 'update' | 'delete' | 'refund' | 'bulk_email';

export interface AuditEntry {
  adminId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, Json | undefined>;
}

/**
 * Records an admin action in the audit log (table audit_logs, read in Admin → Audit Logs).
 *
 * Creating, changing or deleting products, categories and orders is logged by database triggers (migration 029),
 * so those never need a call here. Use this for things the database can't see — server-side actions such as
 * refunds and bulk emails. Pass the SERVICE-ROLE client (nobody else may write to the log).
 *
 * Logging must never break the action it describes, so a failure is reported to the console and swallowed.
 */
export async function logAudit(admin: SupabaseClient, entry: AuditEntry): Promise<void> {
  try {
    const { error } = await admin.from('audit_logs').insert({
      admin_id: entry.adminId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      details: (entry.details ?? {}) as Json,
    });
    if (error) console.error('Audit log write failed:', error.message);
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}
