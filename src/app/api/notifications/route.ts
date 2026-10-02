import type { NextRequest } from 'next/server'
import { fail, ok, readQuery } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { dbError } from '@/lib/utils/db-error'
import { notificationQuerySchema } from '@/lib/validations/notification'

/** PRD section 43: own notifications only. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const query = readQuery(req, notificationQuerySchema)

    let request = auth.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.userId)

    if (query.is_read !== undefined) request = request.eq('is_read', query.is_read)
    if (query.type) request = request.eq('type', query.type)

    const from = (query.page - 1) * query.limit
    const { data, error, count } = await request
      .order('created_at', { ascending: false })
      .range(from, from + query.limit - 1)

    if (error) throw dbError(error)

    return ok(data, 'Notifications retrieved', {
      req,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / query.limit)),
      },
    })
  } catch (error) {
    return fail(error, req)
  }
}