import type { SupabaseClient } from '@supabase/supabase-js'
import { dbError } from '@/lib/utils/db-error'

export type ReportFilter = {
  department_id?: string
  employee_id?: string
  date_from?: string
  date_to?: string
  period_month?: number
  period_year?: number
  leave_type?: string
}

/** PRD section 68 - Employee report. */
export async function employeeReport(sb: SupabaseClient, filter: ReportFilter) {
  const countByStatus = async (status?: 'active' | 'inactive') => {
    let request = sb.from('employees').select('*', { count: 'exact', head: true })
    if (status) request = request.eq('status', status)
    if (filter.department_id) request = request.eq('department_id', filter.department_id)

    const { count, error } = await request
    if (error) throw dbError(error)
    return count ?? 0
  }

  const [total, active, inactive] = await Promise.all([
    countByStatus(),
    countByStatus('active'),
    countByStatus('inactive'),
  ])

  const { data: byDepartment, error } = await sb
    .from('departments')
    .select('id, name, employees(count)')

  if (error) throw dbError(error)

  return {
    total,
    active,
    inactive,
    by_department: (byDepartment ?? []).map((row) => ({
      department_id: row.id,
      department_name: row.name,
      total_employee: row.employees?.[0]?.count ?? 0,
    })),
  }
}

/** PRD section 68 - Attendance report. */
export async function attendanceReport(sb: SupabaseClient, filter: ReportFilter) {
  const statuses = ['present', 'late', 'absent', 'leave'] as const
  const counts: Record<string, number> = {}

  await Promise.all(
    statuses.map(async (status) => {
      let request = sb
        .from('attendance')
        .select('*, employees!inner(id)', { count: 'exact', head: true })
        .eq('status', status)

      if (filter.date_from) request = request.gte('attendance_date', filter.date_from)
      if (filter.date_to) request = request.lte('attendance_date', filter.date_to)
      if (filter.employee_id) request = request.eq('employee_id', filter.employee_id)
      if (filter.department_id) request = request.eq('employees.department_id', filter.department_id)

      const { count, error } = await request
      if (error) throw dbError(error)
      counts[status] = count ?? 0
    }),
  )

  return {
    present: counts.present,
    late: counts.late,
    absent: counts.absent,
    leave: counts.leave,
    total: statuses.reduce((sum, status) => sum + counts[status], 0),
  }
}

/** PRD section 68 - Leave report. */
export async function leaveReport(sb: SupabaseClient, filter: ReportFilter) {
  const statuses = ['pending', 'approved', 'rejected'] as const
  const counts: Record<string, number> = {}

  await Promise.all(
    statuses.map(async (status) => {
      let request = sb.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', status)

      if (filter.leave_type) request = request.eq('leave_type', filter.leave_type)
      if (filter.employee_id) request = request.eq('employee_id', filter.employee_id)
      if (filter.date_from) request = request.gte('start_date', filter.date_from)
      if (filter.date_to) request = request.lte('start_date', filter.date_to)

      const { count, error } = await request
      if (error) throw dbError(error)
      counts[status] = count ?? 0
    }),
  )

  return {
    total_request: statuses.reduce((sum, status) => sum + counts[status], 0),
    pending: counts.pending,
    approved: counts.approved,
    rejected: counts.rejected,
  }
}

/** PRD section 68. Payroll report. With no period filter this sums every
 *  published payslip, so callers that need one period should send period_month
 *  and period_year. */
export async function payrollReport(sb: SupabaseClient, filter: ReportFilter) {
  let request = sb
    .from('payrolls')
    .select('net_salary, allowance, bonus, deduction, employees!inner(id)')
    .eq('status', 'published')

  if (filter.period_month) request = request.eq('period_month', filter.period_month)
  if (filter.period_year) request = request.eq('period_year', filter.period_year)
  if (filter.department_id) request = request.eq('employees.department_id', filter.department_id)
  if (filter.employee_id) request = request.eq('employee_id', filter.employee_id)

  const { data, error } = await request
  if (error) throw dbError(error)

  const rows = data ?? []
  const sum = (key: 'net_salary' | 'allowance' | 'bonus' | 'deduction') =>
    rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)

  const totalNet = sum('net_salary')

  return {
    total_payroll: rows.length,
    average_payroll: rows.length === 0 ? 0 : Math.round((totalNet / rows.length) * 100) / 100,
    total_allowance: sum('allowance'),
    total_bonus: sum('bonus'),
    total_deduction: sum('deduction'),
    total_net_salary: totalNet,
  }
}
