'use server'

import { actionFailure, actionSuccess, actionUnauthenticated, type ActionResult } from '@/lib/action-result'
import { getSession } from '@/lib/supabase/session'

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return actionUnauthenticated()

  // RLS already limits the update to the caller's own rows, so no user filter here.
  const { error } = await session.supabase.from('notifications').update({ is_read: true }).eq('id', id)

  if (error) return actionFailure({ message: error.message, error: error.code })

  return actionSuccess('Notification marked as read.')
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return actionUnauthenticated()

  const { error } = await session.supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', session.userId)
    .eq('is_read', false)

  if (error) return actionFailure({ message: error.message, error: error.code })

  return actionSuccess('All notifications marked as read.')
}
