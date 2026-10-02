import type { NextRequest } from 'next/server'
import { AppError, fail, ok } from '@/lib/api-response'
import { createRequestClient } from '@/lib/supabase/server'

/** PRD section 7: logout clears the server session and the cookies. */
export async function POST(req: NextRequest) {
  try {
    const { client } = createRequestClient(req)
    const { error } = await client.auth.signOut()

    if (error) throw new AppError('LOGOUT_FAILED', error.message, 500)
    return ok(null, 'Logout successful', { req })
  } catch (error) {
    return fail(error, req)
  }
}