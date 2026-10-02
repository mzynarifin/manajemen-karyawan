'use server'

import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { getSession } from '@/lib/supabase/session'
import { employeeSelfUpdateSchema, profileSelfUpdateSchema } from '@/lib/validations/employee'
import { updateEmployeeSelf } from '@/services/employee.service'

/** Both roles may change their own name and avatar (PRD section 57). */
export async function updateProfileAction(input: {
  full_name?: string
  avatar_url?: string | null
}): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, message: 'You need to sign in again.', code: 'AUTH_REQUIRED' }

  const parsed = profileSelfUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.' }

  const { error } = await session.supabase.from('profiles').update(parsed.data).eq('id', session.userId)
  if (error) return actionFailure({ message: error.message, error: error.code })

  return actionSuccess('Profile updated.')
}

/** Employees only (PRD section 57): phone and address. */
export async function updateEmployeeProfileAction(input: {
  phone?: string
  address?: string
}): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, message: 'You need to sign in again.', code: 'AUTH_REQUIRED' }
  if (session.role !== 'employee') {
    return { ok: false, message: 'HR manages employee records from the Employees page.', code: 'FORBIDDEN' }
  }

  const parsed = employeeSelfUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.' }

  const { data: employee, error: lookupError } = await session.supabase
    .from('employees')
    .select('*')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (lookupError) return actionFailure({ message: lookupError.message, error: lookupError.code })
  if (!employee) return { ok: false, message: 'No employee record found for this account.' }

  try {
    const updated = await updateEmployeeSelf(session.supabase, employee, parsed.data)
    return actionSuccess('Profile updated.', updated)
  } catch (error) {
    return actionFailure(error)
  }
}