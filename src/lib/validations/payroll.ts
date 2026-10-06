import { z } from 'zod'
import { initialSchema, paginationSchema, uuidSchema } from '@/lib/validations/common'

const amount = z.coerce.number().min(0)

const amounts = {
  base_salary: amount.default(0),
  allowance: amount.default(0),
  bonus: amount.default(0),
  deduction: amount.default(0),
}

export const payrollCreateSchema = z.object({
  employee_id: uuidSchema,
  period_month: z.coerce.number().int().min(1).max(12),
  period_year: z.coerce.number().int().min(2000).max(2100),
  ...amounts,
})

/**
 * Batch payroll. Every employee carries their own amounts: base salary starts
 * from the employee record and HR types a different allowance, bonus and
 * deduction per person in the same period.
 */
export const payrollBatchCreateSchema = z.object({
  period_month: z.coerce.number().int().min(1).max(12),
  period_year: z.coerce.number().int().min(2000).max(2100),
  items: z
    .array(
      z.object({
        employee_id: uuidSchema,
        base_salary: amount,
        allowance: amount.default(0),
        bonus: amount.default(0),
        deduction: amount.default(0),
      }),
    )
    .min(1, 'Select at least one employee')
    .max(200),
})

export const payrollUpdateSchema = z
  .object({ ...amounts, base_salary: amount.optional(), allowance: amount.optional(), bonus: amount.optional(), deduction: amount.optional() })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

export const payrollQuerySchema = paginationSchema.extend({
  period_month: z.coerce.number().int().min(1).max(12).optional(),
  period_year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum(['draft', 'published']).optional(),
  department_id: uuidSchema.optional(),
  employee_id: uuidSchema.optional(),
  initial: initialSchema,
  sort: z.enum(['created_at', 'net_salary']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type PayrollCreateInput = z.infer<typeof payrollCreateSchema>
export type PayrollBatchCreateInput = z.infer<typeof payrollBatchCreateSchema>
export type PayrollUpdateInput = z.infer<typeof payrollUpdateSchema>
export type PayrollQuery = z.infer<typeof payrollQuerySchema>