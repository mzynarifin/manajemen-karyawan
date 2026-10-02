import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/require-auth'
import { dbError } from '@/lib/utils/db-error'
import { profileSelfUpdateSchema } from '@/lib/validations/employee'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const { data: employee } = await auth.supabase
      .from('employees')
      .select('*, departments(id, name)')
      .eq('user_id', auth.userId)
      .maybeSingle()

    return ok({ user: { id: auth.userId, email: auth.email }, profile: auth.profile, employee: employee ?? null }, 'Profile retrieved', { req })
  } catch (error) {
    return fail(error, req)
  }
}

/** PRD section 57: full_name and avatar_url only. */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    const input = await readJson(req, profileSelfUpdateSchema)

    const { data, error } = await auth.supabase
      .from('profiles')
      .update({ ...input })
      .eq('id', auth.userId)
      .select('*')
      .single()

    if (error) throw dbError(error)
    return ok(data, 'Profile updated', { req })
  } catch (error) {
    return fail(error, req)
  }
}