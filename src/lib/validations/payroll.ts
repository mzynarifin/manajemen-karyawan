import { z } from 'zod'
import { paginationSchema, uuidSchema } from '@/lib/validations/common'

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

export const payrollUpdateSchema = z
  .object({ ...amounts, base_salary: amount.optional(), allowance: amount.optional(), bonus: amount.optional(), deduction: amount.optional() })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

export const payrollQuerySchema = paginationSchema.extend({
  period_month: z.coerce.number().int().min(1).max(12).optional(),
  period_year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum(['draft', 'published']).optional(),
  department_id: uuidSchema.optional(),
  employee_id: uuidSchema.optional(),
  sort: z.enum(['created_at', 'net_salary']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type PayrollCreateInput = z.infer<typeof payrollCreateSchema>
export type PayrollUpdateInput = z.infer<typeof payrollUpdateSchema>
export type PayrollQuery = z.infer<typeof payrollQuerySchema>