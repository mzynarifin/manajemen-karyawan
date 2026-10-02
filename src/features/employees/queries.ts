import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { dbError } from '@/lib/utils/db-error'
import { orSearch, paginationMeta, range } from '@/lib/utils/query'
import type { EmployeeQuery } from '@/lib/validations/employee'

/** employees + department name + account email for the table cell (PRD section 21). */
const EMPLOYEE_SELECT = '*, departments(id, name), profiles(email, avatar_url)'

export type EmployeeRow = {
  id: string
  employee_code: string
  full_name: string
  gender: string | null
  birth_date: string | null
  phone: string | null
  address: string | null
  department_id: string | null
  position: string | null
  join_date: string | null
  employment_type: string | null
  base_salary: number
  status: string
  created_at: string
  updated_at: string
  departments: { id: string; name: string } | null
  profiles: { email: string; avatar_url: string | null } | null
}

export async function listEmployees(sb: SupabaseClient, query: EmployeeQuery) {
  const { from, to } = range(query.page, query.limit)

  let request = sb.from('employees').select(EMPLOYEE_SELECT, { count: 'exact' })

  if (query.search) request = request.or(orSearch(['full_name', 'employee_code', 'position'], query.search))
  if (query.department_id) request = request.eq('department_id', query.department_id)
  if (query.status) request = request.eq('status', query.status)
  if (query.employment_type) request = request.eq('employment_type', query.employment_type)

  const { data, error, count } = await request
    .order(query.sort, { ascending: query.order === 'asc' })
    .range(from, to)

  if (error) throw dbError(error)

  return {
    items: (data ?? []) as EmployeeRow[],
    pagination: paginationMeta(query.page, query.limit, count ?? 0),
  }
}

export async function getEmployee(sb: SupabaseClient, id: string): Promise<EmployeeRow> {
  const { data, error } = await sb.from('employees').select(EMPLOYEE_SELECT).eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404)

  return data as EmployeeRow
}

/** Options for selects: departments, and active employees for payroll / filters. */
export async function listDepartments(sb: SupabaseClient) {
  const { data, error } = await sb.from('departments').select('id, name').order('name')
  if (error) throw dbError(error)
  return (data ?? []) as Array<{ id: string; name: string }>
}

export async function listActiveEmployees(sb: SupabaseClient, search?: string) {
  let request = sb
    .from('employees')
    .select('id, full_name, employee_code, position, base_salary')
    .eq('status', 'active')
    .order('full_name')
    .limit(200)

  if (search) request = request.or(orSearch(['full_name', 'employee_code'], search))

  const { data, error } = await request
  if (error) throw dbError(error)
  return (data ?? []) as Array<{
    id: string
    full_name: string
    employee_code: string
    position: string | null
    base_salary: number
  }>
}