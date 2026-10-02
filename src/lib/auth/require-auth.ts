import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@/lib/api-response'
import { createRequestClient } from '@/lib/supabase/server'
import type { Employee, Profile, Role } from '@/types'

export type AuthContext = {
  userId: string
  email: string
  role: Role
  profile: Profile
  /** User-scoped client: reads go through RLS as this user. */
  supabase: SupabaseClient
}

/**
 * PRD section 7 + 77: every protected route resolves session -> profile ->
 * role here, before touching the database.
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const { client } = createRequestClient(req)
  const { data, error } = await client.auth.getUser()

  if (error || !data.user) throw new AppError('AUTH_REQUIRED', 'Authentication required', 401)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) throw new AppError('PROFILE_LOOKUP_FAILED', profileError.message, 500)
  if (!profile) throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 403)
  if (!profile.is_active) throw new AppError('ACCOUNT_INACTIVE', 'Account is inactive', 403)

  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    profile: profile as Profile,
    supabase: client,
  }
}

export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const auth = await requireAuth(req)
  if (auth.role !== 'admin') throw new AppError('FORBIDDEN', 'Admin access required', 403)
  return auth
}

/** The caller's own employee record, must exist and be active (PRD section 17). */
export async function requireOwnEmployee(auth: AuthContext): Promise<Employee> {
  const { data, error } = await auth.supabase
    .from('employees')
    .select('*')
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (error) throw new AppError('EMPLOYEE_LOOKUP_FAILED', error.message, 500)
  if (!data) throw new AppError('EMPLOYEE_NOT_FOUND', 'No employee record for this account', 403)
  if (data.status !== 'active') throw new AppError('EMPLOYEE_INACTIVE', 'Employee is inactive', 403)

  return data as Employee
}