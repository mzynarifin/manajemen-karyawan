'use server'

import { actionFailure, actionSuccess, type ActionResult } from '@/lib/action-result'
import { requireAdminSession } from '@/lib/supabase/session'
import { payrollBatchCreateSchema, payrollCreateSchema, payrollUpdateSchema } from '@/lib/validations/payroll'
import { createPayroll, createPayrollBatch, publishPayroll, updatePayroll } from '@/services/payroll.service'

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

export type PayrollBatchItem = {
  employee_id: string
  base_salary: string
  allowance?: string
  bonus?: string
  deduction?: string
}

export type PayrollBatchForm = {
  period_month: string
  period_year: string
  items: PayrollBatchItem[]
}

/** One row per employee; already-paid periods are skipped and reported. */
export async function createPayrollBatchAction(input: PayrollBatchForm): Promise<ActionResult> {
  const session = await requireAdminSession()
  const parsed = payrollBatchCreateSchema.safeParse({
    period_month: input.period_month,
    period_year: input.period_year,
    items: input.items.map((item) => ({
      employee_id: item.employee_id,
      base_salary: item.base_salary || 0,
      allowance: item.allowance || 0,
      bonus: item.bonus || 0,
      deduction: item.deduction || 0,
    })),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.')
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, message: 'Please check the highlighted fields.', code: 'VALIDATION_ERROR', fieldErrors }
  }

  try {
    const result = await createPayrollBatch(session.userId, parsed.data)
    const message = result.created.length
      ? `${result.created.length} payroll created${result.skipped.length ? `, ${result.skipped.length} skipped` : ''}.`
      : `All ${result.skipped.length} selected employees already have a payroll for this period.`
    return actionSuccess(message, result)
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