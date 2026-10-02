import type { NextRequest } from 'next/server'
import { AppError, fail, ok } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { dbError } from '@/lib/utils/db-error'
import { parseId } from '@/lib/validations/common'

type Context = { params: Promise<{ id: string }> }

/** Only is_read can be changed, and only on own rows (column grant + RLS). */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAuth(req)
    const id = parseId((await params).id)

    const { data, error } = await auth.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', auth.userId)
      .select('*')
      .maybeSingle()

    if (error) throw dbError(error)
    if (!data) throw new AppError('NOTIFICATION_NOT_FOUND', 'Notification not found', 404)

    return ok(data, 'Notification marked as read', { req })
  } catch (error) {
    return fail(error, req)
  }
}