import type { NextRequest } from 'next/server'
import { fail, ok, readQuery } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth/require-auth'
import { reportQuerySchema } from '@/lib/validations/report'
import {
  attendanceReport,
  employeeReport,
  leaveReport,
  payrollReport,
} from '@/services/report.service'

const REPORTS = {
  employee: employeeReport,
  attendance: attendanceReport,
  leave: leaveReport,
  payroll: payrollReport,
} as const

/** PRD section 68. Reports are HR only. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    const query = readQuery(req, reportQuerySchema)
    const report = await REPORTS[query.type](auth.supabase, query)

    return ok(report, `${query.type} report retrieved`, { req })
  } catch (error) {
    return fail(error, req)
  }
}