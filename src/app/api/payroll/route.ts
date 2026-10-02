import type { NextRequest } from 'next/server'
import { fail, ok, readJson, readQuery } from '@/lib/api-response'
import { requireAdmin, requireAuth, requireOwnEmployee } from '@/lib/auth/require-auth'
import { payrollCreateSchema, payrollQuerySchema } from '@/lib/validations/payroll'
import { createPayroll, listPayrolls } from '@/services/payroll.service'

/** Admin sees every payroll; an employee only sees their own published rows. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const query = readQuery(req, payrollQuerySchema)
    const scope = auth.role === 'admin' ? {} : { employeeId: (await requireOwnEmployee(auth)).id }

    const { items, pagination } = await listPayrolls(auth.supabase, query, scope)
    return ok(items, 'Payrolls retrieved', { req, pagination })
  } catch (error) {
    return fail(error, req)
  }
}

/** PRD section 32 - 34. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    const input = await readJson(req, payrollCreateSchema)
    const payroll = await createPayroll(auth.userId, input)

    return ok(payroll, 'Payroll created successfully', { req, status: 201 })
  } catch (error) {
    return fail(error, req)
  }
}