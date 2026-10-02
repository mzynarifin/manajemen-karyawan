import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from '@/lib/config'
import type { Profile, Role } from '@/types'

/**
 * Cookie based client for Server Components and Server Actions.
 * The middleware already refreshes the session on every request, so reading
 * cookies here is enough (PRD section 9: the real check is backend + RLS).
 */
export async function getSupabase(): Promise<SupabaseClient> {
  const store = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) store.set(name, value, options)
      },
    },
  })
}

export type Session = {
  supabase: SupabaseClient
  userId: string
  email: string
  role: Role
  profile: Profile
}

export async function getSession(): Promise<Session | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile || !profile.is_active) return null

  return {
    supabase,
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    profile: profile as Profile,
  }
}

/** Guard for the admin area: no session -> /login, wrong role -> own dashboard. */
export async function requireAdminSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/employee/dashboard')
  return session
}

/** Guard for the employee area. */
export async function requireEmployeeSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'employee') redirect('/admin/dashboard')
  return session
}

/** Guard for /login itself: an active session never sees the form again. */
export async function redirectIfAuthenticated(): Promise<void> {
  const session = await getSession()
  if (session) redirect(session.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard')
}

export function homeFor(role: Role): string {
  return role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'
}