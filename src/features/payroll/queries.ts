import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'
import type { PayrollQuery } from '@/lib/validations/payroll'

const PAYROLL_SELECT =
  '*, employees!inner(id, full_name, employee_code, position, user_id, department_id, departments(id, name))'

export type PayrollRow = {
  id: string
  employee_id: string
  period_month: number
  period_year: number
  base_salary: number
  allowance: number
  bonus: number
  deduction: number
  net_salary: number
  status: string
  published_at: string | null
  created_at: string
  employees: {
    id: string
    full_name: string
    employee_code: string
    position: string | null
    user_id: string | null
    department_id: string | null
    departments: { id: string; name: string } | null
  }
}

export async function listPayrolls(sb: SupabaseClient, query: PayrollQuery, scope: { employeeId?: string }) {
  const { from, to } = range(query.page, query.limit)

  let request = sb.from('payrolls').select(PAYROLL_SELECT, { count: 'exact' })

  if (scope.employeeId) request = request.eq('employee_id', scope.employeeId)
  if (query.employee_id) request = request.eq('employee_id', query.employee_id)
  if (query.department_id) request = request.eq('employees!inner.department_id', query.department_id)
  if (query.period_month) request = request.eq('period_month', query.period_month)
  if (query.period_year) request = request.eq('period_year', query.period_year)
  if (query.status) request = request.eq('status', query.status)

  const { data, error, count } = await request
    .order(query.sort, { ascending: query.order === 'asc' })
    .range(from, to)

  if (error) throw dbError(error)

  return { items: (data ?? []) as PayrollRow[], pagination: paginationMeta(query.page, query.limit, count ?? 0) }
}

export async function getPayroll(sb: SupabaseClient, id: string): Promise<PayrollRow> {
  const { data, error } = await sb.from('payrolls').select(PAYROLL_SELECT).eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('PAYROLL_NOT_FOUND', 'Payroll not found', 404)

  return data as PayrollRow
}