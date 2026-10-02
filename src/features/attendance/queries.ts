import type { SupabaseClient } from '@supabase/supabase-js'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'
import type { AttendanceQuery } from '@/lib/validations/attendance'

const ATTENDANCE_SELECT = '*, employees!inner(id, full_name, employee_code, department_id)'

export type AttendanceRow = {
  id: string
  employee_id: string
  attendance_date: string
  check_in: string
  check_out: string | null
  working_minutes: number | null
  status: string
  employees: { id: string; full_name: string; employee_code: string; department_id: string | null }
}

export async function listAttendance(
  sb: SupabaseClient,
  query: AttendanceQuery,
  scope: { employeeId?: string },
) {
  const { from, to } = range(query.page, query.limit)

  let request = sb.from('attendance').select(ATTENDANCE_SELECT, { count: 'exact' })

  if (scope.employeeId) request = request.eq('employee_id', scope.employeeId)
  if (query.employee_id) request = request.eq('employee_id', query.employee_id)
  if (query.date_from) request = request.gte('attendance_date', query.date_from)
  if (query.date_to) request = request.lte('attendance_date', query.date_to)
  if (query.status) request = request.eq('status', query.status)
  if (query.department_id) request = request.eq('employees!inner.department_id', query.department_id)

  const { data, error, count } = await request
    .order(query.sort, { ascending: query.order === 'asc' })
    .range(from, to)

  if (error) throw dbError(error)

  return {
    items: (data ?? []) as AttendanceRow[],
    pagination: paginationMeta(query.page, query.limit, count ?? 0),
  }
}

export async function getAttendanceForDate(sb: SupabaseClient, employeeId: string, date: string) {
  const { data, error } = await sb
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('attendance_date', date)
    .maybeSingle()

  if (error) throw dbError(error)
  return data as {
    id: string
    check_in: string
    check_out: string | null
    working_minutes: number | null
    status: string
  } | null
}