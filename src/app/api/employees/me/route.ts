import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-response'
import { requireAuth, requireOwnEmployee } from '@/lib/auth/require-auth'
import { employeeSelfUpdateSchema } from '@/lib/validations/employee'
import { updateEmployeeSelf } from '@/services/employee.service'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const employee = await requireOwnEmployee(auth)

    return ok(employee, 'Employee profile retrieved', { req })
  } catch (error) {
    return fail(error, req)
  }
}

/** PRD section 57: phone and address only, enforced by the schema and again by
 * the column level UPDATE grant in the migration. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const input = await readJson(req, employeeSelfUpdateSchema)
    const employee = await requireOwnEmployee(auth)
    const updated = await updateEmployeeSelf(auth.supabase, employee, input)

    return ok(updated, 'Employee profile updated', { req })
  } catch (error) {
    return fail(error, req)
  }
}