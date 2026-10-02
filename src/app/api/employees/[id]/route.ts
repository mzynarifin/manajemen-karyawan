import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { employeeUpdateSchema } from '@/lib/validations/employee'
import { getEmployeeById, updateEmployee } from '@/services/employee.service'

type Context = { params: Promise<{ id: string }> }

/** An employee reading their own id gets their own row; RLS hides the rest. */
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAuth(req)
    const employee = await getEmployeeById(auth.supabase, parseId((await params).id))

    return ok(employee, 'Employee retrieved', { req })
  } catch (error) {
    return fail(error, req)
  }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAdmin(req)
    const id = parseId((await params).id)
    const input = await readJson(req, employeeUpdateSchema)
    const employee = await updateEmployee(id, input, auth.userId)

    return ok(employee, 'Employee updated successfully', { req })
  } catch (error) {
    return fail(error, req)
  }
}