import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { getAdminClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/utils/db-error'
import { paginationMeta, range } from '@/lib/utils/query'
import type {
  PayrollBatchCreateInput,
  PayrollCreateInput,
  PayrollQuery,
  PayrollUpdateInput,
} from '@/lib/validations/payroll'
import type { Payroll } from '@/types'
import { logActivity } from '@/services/audit.service'
import { notify } from '@/services/notification.service'

const PAYROLL_SELECT = '*, employees!inner(id, employee_code, full_name, position, user_id, departments(id, name))'

/** PRD section 34. Money is rounded to 2 decimals to avoid float drift. */
export function netSalary(input: {
  base_salary: number
  allowance: number
  bonus: number
  deduction: number
}): number {
  const net = input.base_salary + input.allowance + input.bonus - input.deduction
  return Math.round(net * 100) / 100
}

export async function listPayrolls(
  sb: SupabaseClient,
  query: PayrollQuery,
  scope: { employeeId?: string },
) {
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
  return { items: data, pagination: paginationMeta(query.page, query.limit, count ?? 0) }
}

/** PRD section 34, one employee per call. */
export async function createPayroll(actorUserId: string, input: PayrollCreateInput): Promise<Payroll> {
  const admin = getAdminClient()
  const net = netSalary(input)

  if (net < 0) throw new AppError('NET_SALARY_INVALID', 'Net salary cannot be negative', 422)

  const { data, error } = await admin
    .from('payrolls')
    .insert({ ...input, net_salary: net, status: 'draft', created_by: actorUserId })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new AppError('PAYROLL_ALREADY_EXISTS', 'Payroll for this employee and period already exists', 409)
    }
    throw dbError(error)
  }

  await logActivity(admin, {
    userId: actorUserId,
    action: 'create_payroll',
    entity: 'payrolls',
    entityId: data.id,
    description: `Payroll ${input.period_month}/${input.period_year} created as draft`,
  })

  return data as Payroll
}

export type PayrollBatchResult = {
  created: Array<{ id: string; employee_id: string; employee_code: string; full_name: string }>
  skipped: Array<{ employee_id: string; employee_code: string; full_name: string }>
}

/**
 * PRD section 34: one row per employee in a single insert, so a batch is either
 * fully written or not written at all. Amounts are per employee, not shared:
 * everyone keeps the base salary from their record unless HR changed it in the
 * form, and each gets their own allowance, bonus and deduction.
 *
 * Employees who already have a payroll for that period are skipped instead of
 * failing the batch, so hitting the button twice cannot duplicate or wipe
 * anything. ignoreDuplicates covers the race where two admins submit at once.
 */
export async function createPayrollBatch(
  actorUserId: string,
  input: PayrollBatchCreateInput,
): Promise<PayrollBatchResult> {
  const admin = getAdminClient()

  const byEmployee = new Map(input.items.map((item) => [item.employee_id, item]))
  const employeeIds = Array.from(byEmployee.keys())

  const { data: employees, error: employeeError } = await admin
    .from('employees')
    .select('id, employee_code, full_name')
    .in('id', employeeIds)

  if (employeeError) throw dbError(employeeError)

  const found = new Map((employees ?? []).map((employee) => [employee.id, employee]))
  const missing = employeeIds.filter((id) => !found.has(id))
  if (missing.length) {
    throw new AppError('EMPLOYEE_NOT_FOUND', 'Some selected employees no longer exist', 404)
  }

  const { data: existing, error: existingError } = await admin
    .from('payrolls')
    .select('employee_id')
    .in('employee_id', employeeIds)
    .eq('period_month', input.period_month)
    .eq('period_year', input.period_year)

  if (existingError) throw dbError(existingError)

  const alreadyPaid = new Set((existing ?? []).map((row) => row.employee_id))
  const name = (id: string) => ({
    employee_code: found.get(id)!.employee_code,
    full_name: found.get(id)!.full_name,
  })

  const skipped = employeeIds.filter((id) => alreadyPaid.has(id)).map((id) => ({ employee_id: id, ...name(id) }))
  const targets = employeeIds.filter((id) => !alreadyPaid.has(id))

  if (targets.length === 0) return { created: [], skipped }

  const rows = targets.map((id) => {
    const item = byEmployee.get(id)!
    const amounts = {
      base_salary: item.base_salary,
      allowance: item.allowance,
      bonus: item.bonus,
      deduction: item.deduction,
    }
    const net = netSalary(amounts)
    if (net < 0) {
      throw new AppError('NET_SALARY_INVALID', `Deduction is larger than the earnings for ${name(id).full_name}`, 422)
    }
    return {
      employee_id: id,
      period_month: input.period_month,
      period_year: input.period_year,
      ...amounts,
      net_salary: net,
      status: 'draft',
      created_by: actorUserId,
    }
  })

  const { data: inserted, error: insertError } = await admin
    .from('payrolls')
    .upsert(rows, { onConflict: 'employee_id,period_month,period_year', ignoreDuplicates: true })
    .select('id, employee_id')

  if (insertError) throw dbError(insertError)

  const insertedIds = new Set((inserted ?? []).map((row) => row.employee_id))
  const created = (inserted ?? []).map((row) => ({
    id: row.id as string,
    employee_id: row.employee_id,
    ...name(row.employee_id),
  }))

  // Only reachable when another admin inserted the same period mid-flight.
  for (const id of targets) {
    if (!insertedIds.has(id)) skipped.push({ employee_id: id, ...name(id) })
  }

  await logActivity(admin, {
    userId: actorUserId,
    action: 'create_payroll_batch',
    entity: 'payrolls',
    entityId: inserted?.[0]?.id ?? null,
    description: `Payroll ${input.period_month}/${input.period_year}: ${created.length} created, ${skipped.length} skipped`,
  })

  return { created, skipped }
}

/** Only drafts are editable, PRD section 86. */
export async function updatePayroll(
  id: string,
  input: PayrollUpdateInput,
  actorUserId: string,
): Promise<Payroll> {
  const admin = getAdminClient()
  const payroll = await getPayrollById(admin, id)

  if (payroll.status !== 'draft') {
    throw new AppError('PAYROLL_ALREADY_PUBLISHED', 'Published payroll cannot be edited', 409)
  }

  const merged = {
    base_salary: input.base_salary ?? Number(payroll.base_salary),
    allowance: input.allowance ?? Number(payroll.allowance),
    bonus: input.bonus ?? Number(payroll.bonus),
    deduction: input.deduction ?? Number(payroll.deduction),
  }
  const net = netSalary(merged)

  if (net < 0) throw new AppError('NET_SALARY_INVALID', 'Net salary cannot be negative', 422)

  const { data, error } = await admin
    .from('payrolls')
    .update({ ...merged, net_salary: net })
    .eq('id', id)
    .eq('status', 'draft')
    .select('*')
    .single()

  if (error) throw dbError(error)

  await logActivity(admin, {
    userId: actorUserId,
    action: 'update_payroll',
    entity: 'payrolls',
    entityId: id,
    description: `Updated ${JSON.stringify(merged)}`,
  })

  return data as Payroll
}

/** PRD section 37: publish, stamp, notify, then the employee can read it. */
export async function publishPayroll(id: string, actorUserId: string): Promise<Payroll> {
  const admin = getAdminClient()
  await getPayrollById(admin, id)

  const { data, error } = await admin
    .from('payrolls')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .select('*')
    .maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('PAYROLL_ALREADY_PUBLISHED', 'Payroll has already been published', 409)

  const payroll = data as Payroll
  const { data: employee } = await admin
    .from('employees')
    .select('user_id')
    .eq('id', payroll.employee_id)
    .maybeSingle()

  if (employee?.user_id) {
    await notify(admin, {
      userId: employee.user_id,
      title: 'Slip gaji tersedia',
      message: `Slip gaji ${payroll.period_month}/${payroll.period_year} sudah dipublish.`,
      type: 'payroll',
      referenceId: payroll.id,
    })
  }

  await logActivity(admin, {
    userId: actorUserId,
    action: 'publish_payroll',
    entity: 'payrolls',
    entityId: id,
    description: `Published payroll ${payroll.period_month}/${payroll.period_year}`,
  })

  return payroll
}

/** PRD section 39: payslip is a join, not a table. */
export async function getPayslip(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from('payrolls').select(PAYROLL_SELECT).eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('PAYROLL_NOT_FOUND', 'Payroll not found', 404)

  const row = data as Payroll & { employees: { employee_code: string; full_name: string; position: string; departments: { name: string } | null } }

  return {
    payroll: {
      id: row.id,
      period: `${row.period_year}-${String(row.period_month).padStart(2, '0')}`,
      period_month: row.period_month,
      period_year: row.period_year,
      base_salary: row.base_salary,
      allowance: row.allowance,
      bonus: row.bonus,
      deduction: row.deduction,
      net_salary: row.net_salary,
      status: row.status,
      published_at: row.published_at,
    },
    employee: {
      employee_code: row.employees.employee_code,
      full_name: row.employees.full_name,
      position: row.employees.position,
      department: row.employees.departments?.name ?? null,
    },
  }
}

export async function getPayrollById(sb: SupabaseClient, id: string): Promise<Payroll> {
  const { data, error } = await sb.from('payrolls').select('*').eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('PAYROLL_NOT_FOUND', 'Payroll not found', 404)

  return data as Payroll
}