import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { requireOwnEmployee, type AuthContext } from '@/lib/auth/require-auth'
import { ATTENDANCE_GRACE_MINUTES, ATTENDANCE_START_TIME } from '@/lib/config'
import { getAdminClient } from '@/lib/supabase/admin'
import { nowInAppTimezone, workingMinutes, effectiveWorkingMinutes } from '@/lib/utils/date'
import { parseClock, toClock } from '@/lib/utils/clock'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'
import type { AttendanceQuery } from '@/lib/validations/attendance'
import type { Attendance, AttendanceStatus } from '@/types'

const ATTENDANCE_SELECT = '*, employees!inner(id, full_name, employee_code, department_id)'

/** PRD section 17 + 18. The unique (employee_id, attendance_date) index is the
 * real guard against double check-in; this check just gives a 409. */
export async function checkIn(auth: AuthContext): Promise<Attendance> {
  const employee = await requireOwnEmployee(auth)
  const { date, minutes } = nowInAppTimezone()

  const { data: existing } = await auth.supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employee.id)
    .eq('attendance_date', date)
    .maybeSingle()

  if (existing) throw new AppError('ATTENDANCE_ALREADY_EXISTS', 'Already checked in today', 409)

  // HR sets the shift per employee; the env value stays the fallback so
  // employees without a schedule keep behaving exactly as before.
  const shiftStart = employee.work_start ? parseClock(toClock(employee.work_start)!) : parseClock(ATTENDANCE_START_TIME)
  const deadline = shiftStart + ATTENDANCE_GRACE_MINUTES
  const status: AttendanceStatus = minutes <= deadline ? 'present' : 'late'

  const { data, error } = await auth.supabase
    .from('attendance')
    .insert({
      employee_id: employee.id,
      attendance_date: date,
      check_in: new Date().toISOString(),
      status,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError('ATTENDANCE_ALREADY_EXISTS', 'Already checked in today', 409)
    }
    throw dbError(error)
  }

  return data as Attendance
}

/** PRD section 19. */
export async function checkOut(auth: AuthContext): Promise<Attendance> {
  const employee = await requireOwnEmployee(auth)
  const { date } = nowInAppTimezone()

  const { data: attendance, error: readError } = await auth.supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('attendance_date', date)
    .maybeSingle()

  if (readError) throw dbError(readError)
  if (!attendance) throw new AppError('CHECK_IN_REQUIRED', 'Check in first before checking out', 409)
  if (attendance.check_out) throw new AppError('CHECK_OUT_ALREADY_EXISTS', 'Already checked out today', 409)

  const checkOutAt = new Date().toISOString()
  const minutes = effectiveWorkingMinutes(
    workingMinutes(attendance.check_in, checkOutAt),
    employee.break_minutes ?? 0,
  )

  // Employees hold no UPDATE grant on attendance (column privileges, see the
  // migration), so the write goes through the service role after the checks
  // above. The check_out is null guard keeps concurrent check-outs out.
  const { data, error } = await getAdminClient()
    .from('attendance')
    .update({ check_out: checkOutAt, working_minutes: minutes })
    .eq('id', attendance.id)
    .is('check_out', null)
    .select('*')
    .maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('CHECK_OUT_ALREADY_EXISTS', 'Already checked out today', 409)

  return data as Attendance
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
  if (query.initial) request = request.ilike('employees.full_name', `${query.initial}%`)
  if (query.date_from) request = request.gte('attendance_date', query.date_from)
  if (query.date_to) request = request.lte('attendance_date', query.date_to)
  if (query.status) request = request.eq('status', query.status)
  if (query.department_id) request = request.eq('employees.department_id', query.department_id)

  const { data, error, count } = await request
    .order(query.sort, { ascending: query.order === 'asc' })
    .range(from, to)

  if (error) throw dbError(error)
  return { items: data, pagination: paginationMeta(query.page, query.limit, count ?? 0) }
}
