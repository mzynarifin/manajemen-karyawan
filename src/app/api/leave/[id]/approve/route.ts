import type { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { approveLeave } from '@/services/leave.service'

type Context = { params: Promise<{ id: string }> }

/** PRD section 28: status + balance + notification move together. */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAdmin(req)
    const leave = await approveLeave(auth, parseId((await params).id))

    return ok(leave, 'Leave request approved', { req })
  } catch (error) {
    return fail(error, req)
  }
}