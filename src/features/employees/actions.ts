'use server'

import type { ZodError } from 'zod'
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { requireAdminSession } from '@/lib/supabase/session'
import {
  employeeCreateSchema,
  employeeUpdateSchema,
} from '@/lib/validations/employee'
import { createEmployee, setEmployeeActive, updateEmployee } from '@/services/employee.service'

/** The form only needs the first message per field to show it under the input. */
function zodFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
  }
  return fieldErrors
}

export type EmployeeCreateForm = {
  full_name: string
  email: string
  employee_code?: string
  gender?: 'male' | 'female'
  birth_date?: string
  phone?: string
  address?: string
  department_id?: string
  position?: string
  join_date?: string
  employment_type?: 'permanent' | 'contract'
  base_salary?: string
  password?: string
  work_start?: string
  work_end?: string
  break_minutes?: string
}

export async function createEmployeeAction(input: EmployeeCreateForm): Promise<ActionResult> {
  const session = await requireAdminSession()
  const parsed = employeeCreateSchema.safeParse({
    ...input,
    employee_code: input.employee_code || undefined,
    base_salary: input.base_salary || 0,
    gender: input.gender || undefined,
    birth_date: input.birth_date || undefined,
    join_date: input.join_date || undefined,
    work_start: input.work_start || null,
    work_end: input.work_end || null,
    break_minutes: input.break_minutes || 0,
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please check the highlighted fields.',
      code: 'VALIDATION_ERROR',
      fieldErrors: zodFieldErrors(parsed.error),
    }
  }

  try {
    const employee = await createEmployee(session.userId, parsed.data)
    return actionSuccess('Employee created successfully.', employee)
  } catch (error) {
    return actionFailure(error)
  }
}

export type EmployeeUpdateForm = {
  full_name: string
  gender?: 'male' | 'female' | null
  birth_date?: string | null
  phone?: string
  address?: string
  department_id?: string | null
  position?: string
  join_date?: string | null
  employment_type?: 'permanent' | 'contract'
  base_salary?: string
  status?: 'active' | 'inactive'
  work_start?: string | null
  work_end?: string | null
  break_minutes?: string
}

export async function updateEmployeeAction(id: string, input: EmployeeUpdateForm): Promise<ActionResult> {
  const session = await requireAdminSession()
  const parsed = employeeUpdateSchema.safeParse({
    ...input,
    gender: input.gender || undefined,
    birth_date: input.birth_date || undefined,
    department_id: input.department_id || undefined,
    join_date: input.join_date || undefined,
    base_salary: input.base_salary ?? undefined,
    work_start: input.work_start || null,
    work_end: input.work_end || null,
    break_minutes: input.break_minutes || 0,
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please check the highlighted fields.',
      code: 'VALIDATION_ERROR',
      fieldErrors: zodFieldErrors(parsed.error),
    }
  }

  try {
    const employee = await updateEmployee(id, parsed.data, session.userId)
    return actionSuccess('Employee updated successfully.', employee)
  } catch (error) {
    return actionFailure(error)
  }
}

export async function setEmployeeStatusAction(id: string, status: 'active' | 'inactive'): Promise<ActionResult> {
  const session = await requireAdminSession()

  try {
    const employee = await setEmployeeActive(id, status === 'active', session.userId)
    return actionSuccess(
      status === 'active' ? 'Employee reactivated.' : 'Employee deactivated.',
      employee,
    )
  } catch (error) {
    return actionFailure(error)
  }
}