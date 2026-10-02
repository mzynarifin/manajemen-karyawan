import { z } from 'zod'
import { paginationSchema, searchSchema, sortOrderSchema } from '@/lib/validations/common'

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional(),
})

export const departmentUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(300).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

export const departmentQuerySchema = paginationSchema.extend({
  search: searchSchema,
  sort: z.enum(['created_at', 'name']).default('name'),
  order: sortOrderSchema.default('asc'),
})

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>
export type DepartmentQuery = z.infer<typeof departmentQuerySchema>