import type { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { checkOut } from '@/services/attendance.service'

/** PRD section 19. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const attendance = await checkOut(auth)

    return ok(attendance, 'Checked out successfully', { req })
  } catch (error) {
    return fail(error, req)
  }
}