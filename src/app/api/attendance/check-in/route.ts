import type { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { checkIn } from '@/services/attendance.service'

/** PRD section 17 - 18. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const attendance = await checkIn(auth)

    return ok(attendance, 'Checked in successfully', { req, status: 201 })
  } catch (error) {
    return fail(error, req)
  }
}