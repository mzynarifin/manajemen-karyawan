import { createServerClient } from '@supabase/ssr'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from '@/lib/config'
import type { Employee, Profile, Role } from '@/types'

/**
 * Cookie based client for Server Components and Server Actions.
 * The middleware already refreshes the session on every request, so reading
 * cookies here is enough (PRD section 9: the real check is backend + RLS).
 */
export const getSupabase = cache(async (): Promise<SupabaseClient> => {
  const store = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) store.set(name, value, options)
      },
    },
  })
})

export type Session = {
  supabase: SupabaseClient
  userId: string
  email: string
  role: Role
  profile: Profile
}

/** The caller's own employee row, with its department joined for display. */
export type SessionEmployee = Employee & {
  departments: { id: string; name: string } | null
}

export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await getSupabase()

  // getClaims() verifies the JWT signature from the cached signing keys instead
  // of re-fetching the user from the Auth server on every request, which removes
  // a network round trip from every render. Liveness is not lost: is_active is
  // re-read from the database right below, so a deactivated account still fails.
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.claims.sub).maybeSingle()

  if (!profile || !profile.is_active) return null

  return {
    supabase,
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    profile: profile as Profile,
  }
})

/**
 * The signed-in user's own employee record, with the department name joined in.
 *
 * `cache()` means the route layout and the page share one lookup instead of each
 * issuing its own. It returns null rather than redirecting so a page can render
 * its own "no employee record" state.
 */
export const getSessionEmployee = cache(async (session: Session): Promise<SessionEmployee | null> => {
  const { data } = await session.supabase
    .from('employees')
    .select('*, departments(id, name)')
    .eq('user_id', session.userId)
    .maybeSingle()

  return (data as SessionEmployee) ?? null
})

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
