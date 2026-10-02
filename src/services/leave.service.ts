import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { requireOwnEmployee, type AuthContext } from '@/lib/auth/require-auth'
import { nowInAppTimezone, totalDaysInclusive } from '@/lib/utils/date'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'
import type { LeaveCreateInput, LeaveQuery } from '@/lib/validations/leave'
import type { LeaveBalance, LeaveRequest } from '@/types'
import { notifyAdmins } from '@/services/notification.service'

const LEAVE_SELECT = '*, employees!inner(id, full_name, employee_code, department_id)'

/** PRD section 24 + 25. Status is forced to pending by the insert RLS policy. */
export async function createLeave(auth: AuthContext, input: LeaveCreateInput): Promise<LeaveRequest> {
  const employee = await requireOwnEmployee(auth)
  const totalDays = totalDaysInclusive(input.start_date, input.end_date)

  const { data: overlapping, error: overlapError } = await auth.supabase
    .from('leave_requests')
    .select('id, start_date, end_date')
    .eq('employee_id', employee.id)
    .eq('status', 'approved')
    .lte('start_date', input.end_date)
    .gte('end_date', input.start_date)
    .limit(1)

  if (overlapError) throw dbError(overlapError)
  if (overlapping && overlapping.length > 0) {
    throw new AppError('LEAVE_DATE_CONFLICT', 'Dates overlap an approved leave request', 409)
  }

  if (input.leave_type === 'annual') {
    const balance = await getBalance(auth.supabase, employee.id, Number(input.start_date.slice(0, 4)))
    if (!balance) throw new AppError('LEAVE_BALANCE_NOT_FOUND', 'Leave balance not found for that year', 404)
    if (balance.remaining_leave < totalDays) {
      throw new AppError(
        'LEAVE_BALANCE_INSUFFICIENT',
        `Remaining leave is ${balance.remaining_leave} day(s), request needs ${totalDays}`,
        409,
      )
    }
  }

  const { data, error } = await auth.supabase
    .from('leave_requests')
    .insert({
      employee_id: employee.id,
      leave_type: input.leave_type,
      start_date: input.start_date,
      end_date: input.end_date,
      total_days: totalDays,
      reason: input.reason,
    })
    .select('*')
    .single()

  if (error) throw dbError(error)

  const leave = data as LeaveRequest

  await notifyAdmins({
    title: 'Pengajuan cuti baru',
    message: `${employee.full_name} mengajukan cuti ${input.leave_type} ${input.start_date} s.d. ${input.end_date} (${totalDays} hari).`,
    type: 'leave',
    referenceId: leave.id,
  })

  return leave
}

/** PRD section 28 + 30 + 31: status, balance and notification in one transaction. */
export async function approveLeave(auth: AuthContext, leaveId: string): Promise<LeaveRequest> {
  const { data, error } = await auth.supabase.rpc('approve_leave', { p_leave_id: leaveId })

  if (error) throw dbError(error)
  return (Array.isArray(data) ? data[0] : data) as LeaveRequest
}

/** PRD section 29. Balance is untouched on reject. */
export async function rejectLeave(auth: AuthContext, leaveId: string, reason: string): Promise<LeaveRequest> {
  const { data, error } = await auth.supabase.rpc('reject_leave', { p_leave_id: leaveId, p_reason: reason })

  if (error) throw dbError(error)
  return (Array.isArray(data) ? data[0] : data) as LeaveRequest
}

export async function listLeave(
  sb: SupabaseClient,
  query: LeaveQuery,
  scope: { employeeId?: string },
) {
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
  return { items: data, pagination: paginationMeta(query.page, query.limit, count ?? 0) }
}

export async function getLeaveById(sb: SupabaseClient, id: string): Promise<LeaveRequest> {
  const { data, error } = await sb.from('leave_requests').select(LEAVE_SELECT).eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('LEAVE_NOT_FOUND', 'Leave request not found', 404)

  return data as LeaveRequest
}

export async function getBalance(
  sb: SupabaseClient,
  employeeId: string,
  year = nowInAppTimezone().year,
): Promise<LeaveBalance | null> {
  const { data, error } = await sb
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .maybeSingle()

  if (error) throw dbError(error)
  return (data as LeaveBalance) ?? null
}