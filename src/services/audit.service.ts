import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditInput = {
  userId: string | null
  action: string
  entity: string
  entityId?: string | null
  description?: string | null
}

/**
 * PRD section 44. Audit failures are logged, never thrown: losing the log
 * must not roll back the business operation the admin just performed.
 */
export async function logActivity(sb: SupabaseClient, input: AuditInput): Promise<void> {
  const { error } = await sb.from('audit_logs').insert({
    user_id: input.userId,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    description: input.description ?? null,
  })

  if (error) console.error('[audit] failed to record activity', input.action, error.message)
}