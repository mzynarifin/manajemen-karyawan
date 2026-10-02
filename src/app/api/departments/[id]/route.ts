import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { departmentUpdateSchema } from '@/lib/validations/department'
import { getDepartmentById, updateDepartment } from '@/services/department.service'

type Context = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAuth(req)
    const department = await getDepartmentById(auth.supabase, parseId((await params).id))

    return ok(department, 'Department retrieved', { req })
  } catch (error) {
    return fail(error, req)
  }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAdmin(req)
    const id = parseId((await params).id)
    const input = await readJson(req, departmentUpdateSchema)
    const department = await updateDepartment(id, input, auth.userId)

    return ok(department, 'Department updated successfully', { req })
  } catch (error) {
    return fail(error, req)
  }
}