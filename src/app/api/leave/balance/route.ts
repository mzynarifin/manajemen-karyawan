import type { NextRequest } from 'next/server'
import { AppError, fail, ok, readQuery } from '@/lib/api-response'
import { requireAuth, requireOwnEmployee } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { balanceQuerySchema } from '@/lib/validations/leave'
import { getBalance } from '@/services/leave.service'

/** Own balance by default; an admin may pass employee_id. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const query = readQuery(req, balanceQuerySchema)

    let employeeId = query.employee_id
    if (!employeeId) {
      if (auth.role === 'admin') {
        throw new AppError('EMPLOYEE_ID_REQUIRED', 'employee_id is required for admin', 400)
      }
      employeeId = (await requireOwnEmployee(auth)).id
    } else if (auth.role !== 'admin') {
      const own = await requireOwnEmployee(auth)
      if (own.id !== employeeId) throw new AppError('FORBIDDEN', 'Cannot read another employee balance', 403)
    }

    const balance = await getBalance(auth.supabase, parseId(employeeId), query.year)
    if (!balance) throw new AppError('LEAVE_BALANCE_NOT_FOUND', 'Leave balance not found', 404)

    return ok(balance, 'Leave balance retrieved', { req })
  } catch (error) {
    return fail(error, req)
  }
}