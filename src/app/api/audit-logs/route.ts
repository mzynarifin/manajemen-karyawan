import type { NextRequest } from 'next/server'
import { fail, ok, readQuery } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth/require-auth'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'
import { auditLogQuerySchema } from '@/lib/validations/notification'

/** PRD section 44 - HR activity history. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    const query = readQuery(req, auditLogQuerySchema)
    const { from, to } = range(query.page, query.limit)

    let request = auth.supabase.from('audit_logs').select('*, profiles(full_name, email)', { count: 'exact' })

    if (query.action) request = request.eq('action', query.action)
    if (query.entity) request = request.eq('entity', query.entity)
    if (query.entity_id) request = request.eq('entity_id', query.entity_id)
    if (query.user_id) request = request.eq('user_id', query.user_id)

    const { data, error, count } = await request
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw dbError(error)
    return ok(data, 'Audit logs retrieved', {
      req,
      pagination: paginationMeta(query.page, query.limit, count ?? 0),
    })
  } catch (error) {
    return fail(error, req)
  }
}