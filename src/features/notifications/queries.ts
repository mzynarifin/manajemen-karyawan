import type { SupabaseClient } from '@supabase/supabase-js'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'

export type NotificationRow = {
  id: string
  title: string
  message: string
  type: string
  reference_id: string | null
  is_read: boolean
  created_at: string
}

export async function listNotifications(
  sb: SupabaseClient,
  params: { userId: string; page: number; limit: number; isRead?: boolean },
) {
  const { from, to } = range(params.page, params.limit)

  let request = sb.from('notifications').select('*', { count: 'exact' }).eq('user_id', params.userId)
  if (params.isRead !== undefined) request = request.eq('is_read', params.isRead)

  const { data, error, count } = await request.order('created_at', { ascending: false }).range(from, to)

  if (error) throw dbError(error)

  return {
    items: (data ?? []) as NotificationRow[],
    pagination: paginationMeta(params.page, params.limit, count ?? 0),
  }
}