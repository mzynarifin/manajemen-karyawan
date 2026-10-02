import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'
import type { LeaveQuery } from '@/lib/validations/leave'

const LEAVE_SELECT =
  '*, employees!inner(id, full_name, employee_code, user_id, department_id), profiles!leave_requests_reviewed_by_fkey(full_name)'

export type LeaveRow = {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: string
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
  employees: {
    id: string
    full_name: string
    employee_code: string
    user_id: string | null
    department_id: string | null
  }
  profiles: { full_name: string } | null
}

export async function listLeave(sb: SupabaseClient, query: LeaveQuery, scope: { employeeId?: string }) {
  const { from, to } = range(query.page, query.limit)

  let request = sb.from('leave_requests').select(LEAVE_SELECT, { count: 'exact' })

  if (scope.employeeId) request = request.eq('employee_id', scope.employeeId)
  if (query.employee_id) request = request.eq('employee_id', query.employee_id)
  if (query.status) request = request.eq('status', query.status)
  if (query.leave_type) request = request.eq('leave_type', query.leave_type)
  if (query.date_from) request = request.gte('start_date', query.date_from)
  if (query.date_to) request = request.lte('start_date', query.date_to)

  const { data, error, count } = await request
    .order(query.sort, { ascending: query.order === 'asc' })
    .range(from, to)

  if (error) throw dbError(error)

  return { items: (data ?? []) as LeaveRow[], pagination: paginationMeta(query.page, query.limit, count ?? 0) }
}

export async function getLeave(sb: SupabaseClient, id: string): Promise<LeaveRow> {
  const { data, error } = await sb.from('leave_requests').select(LEAVE_SELECT).eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('LEAVE_NOT_FOUND', 'Leave request not found', 404)

  return data as LeaveRow
}

export async function getLeaveBalance(sb: SupabaseClient, employeeId: string, year: number) {
  const { data, error } = await sb
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .maybeSingle()

  if (error) throw dbError(error)
  return data as { total_leave: number; used_leave: number; remaining_leave: number } | null
}

export async function countByStatus(sb: SupabaseClient) {
  const statuses = ['pending', 'approved', 'rejected'] as const
  const result: Record<string, number> = {}

  for (const status of statuses) {
    const { count, error } = await sb
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)

    if (error) throw dbError(error)
    result[status] = count ?? 0
  }

  return result
}