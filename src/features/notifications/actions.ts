'use server'

import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { getSupabase } from '@/lib/supabase/session'

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const supabase = await getSupabase()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) return actionFailure({ message: error.message, error: error.code })

  return actionSuccess('Notification marked as read.')
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const supabase = await getSupabase()

  const { data: sessionData } = await supabase.auth.getUser()
  if (!sessionData.user) return { ok: false, message: 'You need to sign in again.', code: 'AUTH_REQUIRED' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', sessionData.user.id)
    .eq('is_read', false)

  if (error) return actionFailure({ message: error.message, error: error.code })

  return actionSuccess('All notifications marked as read.')
}