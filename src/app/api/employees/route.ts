import type { NextRequest } from 'next/server'
import { fail, ok, readJson, readQuery } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth/require-auth'
import { employeeCreateSchema, employeeQuerySchema } from '@/lib/validations/employee'
import { createEmployee, listEmployees } from '@/services/employee.service'

/** PRD section 3.1: only HR/Admin sees all employees. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    const query = readQuery(req, employeeQuerySchema)
    const { items, pagination } = await listEmployees(auth.supabase, query)

    return ok(items, 'Employees retrieved', { req, pagination })
  } catch (error) {
    return fail(error, req)
  }
}

/** PRD section 56. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    const input = await readJson(req, employeeCreateSchema)
    const employee = await createEmployee(auth.userId, input)

    return ok(employee, 'Employee created successfully', { req, status: 201 })
  } catch (error) {
    return fail(error, req)
  }
}