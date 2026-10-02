import type { NextRequest } from 'next/server'
import { AppError, fail, ok, readJson } from '@/lib/api-response'
import { createRequestClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'

/** PRD section 6: Supabase Auth verifies the credentials, then the backend
 * loads the profile to decide what the session may do. */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await readJson(req, loginSchema)
    const { client } = createRequestClient(req)

    const { data, error } = await client.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect', 401)
    }

    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 403)

    if (!profile.is_active) {
      await client.auth.signOut()
      throw new AppError('ACCOUNT_INACTIVE', 'Account is inactive', 403)
    }

    return ok(
      {
        user: { id: data.user.id, email: data.user.email },
        profile,
      },
      'Login successful',
      { req },
    )
  } catch (error) {
    return fail(error, req)
  }
}