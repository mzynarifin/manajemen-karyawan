import type { NextRequest } from 'next/server'
import { fail, ok, readJson, readQuery } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth/require-auth'
import { departmentCreateSchema, departmentQuerySchema } from '@/lib/validations/department'
import { createDepartment, listDepartments } from '@/services/department.service'

/** Any signed-in user may read departments (needed to fill forms). */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const query = readQuery(req, departmentQuerySchema)
    const { items, pagination } = await listDepartments(auth.supabase, query)

    return ok(items, 'Departments retrieved', { req, pagination })
  } catch (error) {
    return fail(error, req)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    const input = await readJson(req, departmentCreateSchema)
    const department = await createDepartment(auth.userId, input)

    return ok(department, 'Department created successfully', { req, status: 201 })
  } catch (error) {
    return fail(error, req)
  }
}