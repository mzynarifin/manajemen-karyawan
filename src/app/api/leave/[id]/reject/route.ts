import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { leaveRejectSchema } from '@/lib/validations/leave'
import { rejectLeave } from '@/services/leave.service'

type Context = { params: Promise<{ id: string }> }

/** PRD section 29. */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAdmin(req)
    const id = parseId((await params).id)
    const { reason } = await readJson(req, leaveRejectSchema)
    const leave = await rejectLeave(auth, id, reason)

    return ok(leave, 'Leave request rejected', { req })
  } catch (error) {
    return fail(error, req)
  }
}