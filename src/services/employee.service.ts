import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { DEFAULT_ANNUAL_LEAVE } from '@/lib/config'
import { getAdminClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/utils/db-error'
import { nextEmployeeCode } from '@/lib/utils/employee-code'
import { orSearch, paginationMeta, range, resolveSort } from '@/lib/utils/query'
import type {
  EmployeeCreateInput,
  EmployeeQuery,
  EmployeeSelfUpdateInput,
  EmployeeUpdateInput,
} from '@/lib/validations/employee'
import type { Employee } from '@/types'
import { logActivity } from '@/services/audit.service'

const EMPLOYEE_SELECT = '*, departments(id, name)'
const SORTABLE = ['created_at', 'full_name', 'join_date', 'employee_code']

export async function listEmployees(sb: SupabaseClient, query: EmployeeQuery) {
  const sort = resolveSort(query.sort, query.order, SORTABLE, 'created_at')
  const { from, to } = range(query.page, query.limit)

  let request = sb.from('employees').select(EMPLOYEE_SELECT, { count: 'exact' })

  if (query.search) request = request.or(orSearch(['full_name', 'employee_code', 'position'], query.search))
  if (query.department_id) request = request.eq('department_id', query.department_id)
  if (query.status) request = request.eq('status', query.status)
  if (query.employment_type) request = request.eq('employment_type', query.employment_type)

  const { data, error, count } = await request
    .order(sort.column, { ascending: sort.order === 'asc' })
    .range(from, to)

  if (error) throw dbError(error)
  return { items: data, pagination: paginationMeta(query.page, query.limit, count ?? 0) }
}

export async function getEmployeeById(sb: SupabaseClient, id: string): Promise<Employee> {
  const { data, error } = await sb.from('employees').select(EMPLOYEE_SELECT).eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  // RLS hides other employees' rows, so a missing row is a 404 either way.
  if (!data) throw new AppError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404)

  return data as Employee
}

/**
 * PRD section 56. Auth user first, then one plpgsql call for employee +
 * leave balance + notification + audit log. Any failure removes the auth
 * user again so there is never a half-created employee.
 */
export async function createEmployee(actorUserId: string, input: EmployeeCreateInput) {
  const admin = getAdminClient()

  const { data: duplicate } = await admin.from('profiles').select('id').eq('email', input.email).maybeSingle()
  if (duplicate) throw new AppError('EMAIL_ALREADY_EXISTS', 'Email already exists', 409)

  const employeeCode = input.employee_code ?? (await generateEmployeeCode(admin))
  const password = input.password ?? temporaryPassword()

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  })

  if (authError || !created?.user) {
    throw new AppError('ACCOUNT_CREATE_FAILED', authError?.message || 'Failed to create account', 400)
  }

  const userId = created.user.id

  try {
    if (input.role !== 'employee') {
      const { error } = await admin.from('profiles').update({ role: input.role }).eq('id', userId)
      if (error) throw dbError(error)
    }

    const { data: employeeId, error } = await admin.rpc('create_employee', {
      p_actor_id: actorUserId,
      p_user_id: userId,
      p_employee_code: employeeCode,
      p_full_name: input.full_name,
      p_gender: input.gender ?? null,
      p_birth_date: input.birth_date ?? null,
      p_phone: input.phone ?? null,
      p_address: input.address ?? null,
      p_department_id: input.department_id ?? null,
      p_position: input.position ?? null,
      p_join_date: input.join_date ?? null,
      p_employment_type: input.employment_type,
      p_base_salary: input.base_salary,
      p_avatar_url: null,
      p_default_annual_leave: DEFAULT_ANNUAL_LEAVE,
    })

    if (error) throw dbError(error)

    return {
      id: employeeId as string,
      user_id: userId,
      employee_code: employeeCode,
      email: input.email,
      role: input.role,
      // Returned once so HR can hand it over; the API never stores or
      // returns it again (PRD section 76).
      temporary_password: password,
    }
  } catch (failure) {
    await admin.auth.admin.deleteUser(userId)
    throw failure
  }
}

export async function updateEmployee(
  id: string,
  input: EmployeeUpdateInput,
  actorUserId: string,
): Promise<Employee> {
  const admin = getAdminClient()
  await getEmployeeById(admin, id)

  const { data, error } = await admin
    .from('employees')
    .update({ ...input })
    .eq('id', id)
    .select(EMPLOYEE_SELECT)
    .single()

  if (error) throw dbError(error)

  await logActivity(admin, {
    userId: actorUserId,
    action: input.status === 'inactive' ? 'deactivate_employee' : 'update_employee',
    entity: 'employees',
    entityId: id,
    description: `Updated ${JSON.stringify(input)}`,
  })

  return data as Employee
}

/** PRD section 11 + 58: soft delete, history stays queryable. */
export async function setEmployeeActive(
  id: string,
  active: boolean,
  actorUserId: string,
): Promise<Employee> {
  const admin = getAdminClient()
  const employee = await getEmployeeById(admin, id)

  const { data, error } = await admin
    .from('employees')
    .update({ status: active ? 'active' : 'inactive' })
    .eq('id', id)
    .select(EMPLOYEE_SELECT)
    .single()

  if (error) throw dbError(error)

  if (employee.user_id) {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ is_active: active })
      .eq('id', employee.user_id)

    if (profileError) throw dbError(profileError)
  }

  await logActivity(admin, {
    userId: actorUserId,
    action: active ? 'reactivate_employee' : 'deactivate_employee',
    entity: 'employees',
    entityId: id,
    description: `${active ? 'Reactivated' : 'Deactivated'} ${employee.employee_code}`,
  })

  return data as Employee
}

/** PRD section 57: employees may only edit phone and address. */
export async function updateEmployeeSelf(
  sb: SupabaseClient,
  employee: Employee,
  input: EmployeeSelfUpdateInput,
): Promise<Employee> {
  const { data, error } = await sb
    .from('employees')
    .update({ ...input })
    .eq('id', employee.id)
    .select(EMPLOYEE_SELECT)
    .single()

  if (error) throw dbError(error)
  return data as Employee
}

async function generateEmployeeCode(admin: SupabaseClient): Promise<string> {
  const { data, error } = await admin
    .from('employees')
    .select('employee_code')
    .order('employee_code', { ascending: false })
    .limit(1)

  if (error) throw dbError(error)
  return nextEmployeeCode(data?.[0]?.employee_code)
}

function temporaryPassword(): string {
  return `Tmp-${randomBytes(9).toString('hex')}-7a`
}