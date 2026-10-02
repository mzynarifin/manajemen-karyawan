import type { NextRequest } from 'next/server'
import { fail, ok, readQuery } from '@/lib/api-response'
import { requireAuth, requireOwnEmployee } from '@/lib/auth/require-auth'
import { attendanceQuerySchema } from '@/lib/validations/attendance'
import { listAttendance } from '@/services/attendance.service'

/** Admin sees every attendance; an employee is scoped to their own rows. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const query = readQuery(req, attendanceQuerySchema)
    const scope =
      auth.role === 'admin' ? {} : { employeeId: (await requireOwnEmployee(auth)).id }

    const { items, pagination } = await listAttendance(auth.supabase, query, scope)
    return ok(items, 'Attendance retrieved', { req, pagination })
  } catch (error) {
    return fail(error, req)
  }
}