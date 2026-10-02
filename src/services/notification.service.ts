import type { SupabaseClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types'

export type NotifyInput = {
  userId: string
  title: string
  message: string
  type: NotificationType
  referenceId?: string | null
}

export async function notify(sb: SupabaseClient, input: NotifyInput): Promise<void> {
  const { error } = await sb.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    reference_id: input.referenceId ?? null,
  })

  if (error) console.error('[notification] failed to insert', input.title, error.message)
}

/** PRD section 24: HR is notified when an employee submits a request.
 * Uses the service role client on purpose: RLS hides other profiles from an
 * employee, so the admin list would come back empty. */
export async function notifyAdmins(
  input: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  const db = getAdminClient()
  const { data, error } = await db.from('profiles').select('id').eq('role', 'admin').eq('is_active', true)

  if (error) {
    console.error('[notification] failed to list admins', error.message)
    return
  }

  const rows = (data ?? []).map((admin) => ({
    user_id: admin.id,
    title: input.title,
    message: input.message,
    type: input.type,
    reference_id: input.referenceId ?? null,
  }))

  if (rows.length === 0) return

  const { error: insertError } = await db.from('notifications').insert(rows)
  if (insertError) console.error('[notification] failed to insert admin notifications', insertError.message)
}