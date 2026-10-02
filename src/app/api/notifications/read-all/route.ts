import type { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { dbError } from '@/lib/utils/db-error'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const { error } = await auth.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', auth.userId)
      .eq('is_read', false)

    if (error) throw dbError(error)
    return ok(null, 'All notifications marked as read', { req })
  } catch (error) {
    return fail(error, req)
  }
}