import type { NextRequest } from 'next/server'
import { fail, ok, readJson, readQuery } from '@/lib/api-response'
import { requireAuth, requireOwnEmployee } from '@/lib/auth/require-auth'
import { leaveCreateSchema, leaveQuerySchema } from '@/lib/validations/leave'
import { createLeave, listLeave } from '@/services/leave.service'

/** Admin sees all requests, an employee only their own. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const query = readQuery(req, leaveQuerySchema)
    const scope = auth.role === 'admin' ? {} : { employeeId: (await requireOwnEmployee(auth)).id }

    const { items, pagination } = await listLeave(auth.supabase, query, scope)
    return ok(items, 'Leave requests retrieved', { req, pagination })
  } catch (error) {
    return fail(error, req)
  }
}

/** PRD section 24. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const input = await readJson(req, leaveCreateSchema)
    const leave = await createLeave(auth, input)

    return ok(leave, 'Leave request submitted successfully', { req, status: 201 })
  } catch (error) {
    return fail(error, req)
  }
}