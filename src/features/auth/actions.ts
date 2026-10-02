'use server'

import { redirect } from 'next/navigation'
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { getSupabase, homeFor } from '@/lib/supabase/session'
import { loginSchema } from '@/lib/validations/auth'

/** PRD section 8: redirect by role after a successful login. */
export async function loginAction(email: string, password: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { ok: false, message: 'Email and password are required.' }
  }

  const supabase = await getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    return { ok: false, message: 'Email or password is incorrect.', code: 'INVALID_CREDENTIALS' }
  }

  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', data.user.id).maybeSingle()

  if (!profile) return { ok: false, message: 'Profile not found.', code: 'PROFILE_NOT_FOUND' }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { ok: false, message: 'This account is inactive. Contact HR.', code: 'ACCOUNT_INACTIVE' }
  }

  redirect(homeFor(profile.role))
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    const supabase = await getSupabase()
    await supabase.auth.signOut()
  } catch (error) {
    return actionFailure(error)
  }

  redirect('/login')
  return actionSuccess('Signed out.')
}