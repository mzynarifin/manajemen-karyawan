import type { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { getLeaveById } from '@/services/leave.service'

type Context = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAuth(req)
    const leave = await getLeaveById(auth.supabase, parseId((await params).id))

    return ok(leave, 'Leave request retrieved', { req })
  } catch (error) {
    return fail(error, req)
  }
}