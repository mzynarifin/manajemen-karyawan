import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-response'
import { requireAdmin, requireAuth } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { payrollUpdateSchema } from '@/lib/validations/payroll'
import { getPayslip, updatePayroll } from '@/services/payroll.service'

type Context = { params: Promise<{ id: string }> }

/** PRD section 39: payslip = employees + departments + payrolls. */
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAuth(req)
    const payslip = await getPayslip(auth.supabase, parseId((await params).id))

    return ok(payslip, 'Payslip retrieved', { req })
  } catch (error) {
    return fail(error, req)
  }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAdmin(req)
    const id = parseId((await params).id)
    const input = await readJson(req, payrollUpdateSchema)
    const payroll = await updatePayroll(id, input, auth.userId)

    return ok(payroll, 'Payroll updated successfully', { req })
  } catch (error) {
    return fail(error, req)
  }
}