'use server'

import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { requireAdminSession } from '@/lib/supabase/session'
import { payrollCreateSchema, payrollUpdateSchema } from '@/lib/validations/payroll'
import { createPayroll, publishPayroll, updatePayroll } from '@/services/payroll.service'

export type PayrollForm = {
  employee_id: string
  period_month: string
  period_year: string
  base_salary: string
  allowance?: string
  bonus?: string
  deduction?: string
}

export async function createPayrollAction(input: PayrollForm): Promise<ActionResult> {
  const session = await requireAdminSession()
  const parsed = payrollCreateSchema.safeParse({
    employee_id: input.employee_id,
    period_month: input.period_month,
    period_year: input.period_year,
    base_salary: input.base_salary || 0,
    allowance: input.allowance || 0,
    bonus: input.bonus || 0,
    deduction: input.deduction || 0,
  })

  if (!parsed.success) {
    return { ok: false, message: 'Please check the highlighted fields.' }
  }

  try {
    const payroll = await createPayroll(session.userId, parsed.data)
    return actionSuccess('Payroll created as draft.', payroll)
  } catch (error) {
    return actionFailure(error)
  }
}

export async function updatePayrollAction(
  id: string,
  input: { base_salary?: string; allowance?: string; bonus?: string; deduction?: string },
): Promise<ActionResult> {
  const session = await requireAdminSession()
  const parsed = payrollUpdateSchema.safeParse({
    base_salary: input.base_salary || undefined,
    allowance: input.allowance || undefined,
    bonus: input.bonus || undefined,
    deduction: input.deduction || undefined,
  })

  if (!parsed.success) {
    return { ok: false, message: 'Please check the highlighted fields.' }
  }

  try {
    const payroll = await updatePayroll(id, parsed.data, session.userId)
    return actionSuccess('Payroll updated.', payroll)
  } catch (error) {
    return actionFailure(error)
  }
}

export async function publishPayrollAction(id: string): Promise<ActionResult> {
  const session = await requireAdminSession()

  try {
    const payroll = await publishPayroll(id, session.userId)
    return actionSuccess('Payroll published.', payroll)
  } catch (error) {
    return actionFailure(error)
  }
}