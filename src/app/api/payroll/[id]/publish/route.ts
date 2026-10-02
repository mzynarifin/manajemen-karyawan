import type { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { publishPayroll } from '@/services/payroll.service'

type Context = { params: Promise<{ id: string }> }

/** PRD section 37. */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAdmin(req)
    const payroll = await publishPayroll(parseId((await params).id), auth.userId)

    return ok(payroll, 'Payroll published successfully', { req })
  } catch (error) {
    return fail(error, req)
  }
}