import type { NextRequest } from 'next/server'
import { fail, ok, readQuery } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { notificationQuerySchema } from '@/lib/validations/notification'
import { listNotifications } from '@/services/notification.service'

/** PRD section 43: own notifications only. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const query = readQuery(req, notificationQuerySchema)

    const { items, pagination } = await listNotifications(auth.supabase, { ...query, userId: auth.userId })

    return ok(items, 'Notifications retrieved', { req, pagination })
  } catch (error) {
    return fail(error, req)
  }
}