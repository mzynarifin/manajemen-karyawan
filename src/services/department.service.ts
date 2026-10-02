import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { getAdminClient } from '@/lib/supabase/admin'
import { dbError } from '@/lib/utils/db-error'
import { orSearch, paginationMeta, range, resolveSort } from '@/lib/utils/query'
import type { DepartmentCreateInput, DepartmentQuery, DepartmentUpdateInput } from '@/lib/validations/department'
import type { Department } from '@/types'
import { logActivity } from '@/services/audit.service'

const DEPARTMENT_SELECT = '*, employees(count)'

export async function listDepartments(sb: SupabaseClient, query: DepartmentQuery) {
  const sort = resolveSort(query.sort, query.order, ['created_at', 'name'], 'name')
  const { from, to } = range(query.page, query.limit)

  let request = sb.from('departments').select(DEPARTMENT_SELECT, { count: 'exact' })
  if (query.search) request = request.or(orSearch(['name'], query.search))

  const { data, error, count } = await request
    .order(sort.column, { ascending: sort.order === 'asc' })
    .range(from, to)

  if (error) throw dbError(error)
  return { items: data, pagination: paginationMeta(query.page, query.limit, count ?? 0) }
}

export async function getDepartmentById(sb: SupabaseClient, id: string): Promise<Department> {
  const { data, error } = await sb.from('departments').select(DEPARTMENT_SELECT).eq('id', id).maybeSingle()

  if (error) throw dbError(error)
  if (!data) throw new AppError('DEPARTMENT_NOT_FOUND', 'Department not found', 404)

  return data as Department
}

export async function createDepartment(actorUserId: string, input: DepartmentCreateInput): Promise<Department> {
  const admin = getAdminClient()
  const { data, error } = await admin.from('departments').insert({ ...input }).select(DEPARTMENT_SELECT).single()

  if (error) throw dbError(error)

  await logActivity(admin, {
    userId: actorUserId,
    action: 'create_department',
    entity: 'departments',
    entityId: data.id,
    description: `Created department ${input.name}`,
  })

  return data as Department
}

export async function updateDepartment(
  id: string,
  input: DepartmentUpdateInput,
  actorUserId: string,
): Promise<Department> {
  const admin = getAdminClient()
  await getDepartmentById(admin, id)

  const { data, error } = await admin
    .from('departments')
    .update({ ...input })
    .eq('id', id)
    .select(DEPARTMENT_SELECT)
    .single()

  if (error) throw dbError(error)

  await logActivity(admin, {
    userId: actorUserId,
    action: 'update_department',
    entity: 'departments',
    entityId: id,
    description: `Updated ${JSON.stringify(input)}`,
  })

  return data as Department
}