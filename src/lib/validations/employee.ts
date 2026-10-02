import { z } from 'zod'
import { paginationSchema, searchSchema, sortOrderSchema, uuidSchema } from '@/lib/validations/common'

const optionalText = (max: number) => z.string().trim().max(max).optional()

export const employeeCreateSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72).optional(),
  full_name: z.string().trim().min(3).max(120),
  employee_code: z.string().trim().regex(/^EMP-\d{4,}$/).optional(),
  role: z.enum(['admin', 'employee']).default('employee'),
  gender: z.enum(['male', 'female']).optional(),
  birth_date: z.iso.date().optional(),
  phone: optionalText(20),
  address: optionalText(500),
  department_id: uuidSchema.optional(),
  position: optionalText(80),
  join_date: z.iso.date().optional(),
  employment_type: z.enum(['permanent', 'contract']).default('permanent'),
  base_salary: z.coerce.number().min(0).default(0),
})

export const employeeUpdateSchema = z
  .object({
    full_name: z.string().trim().min(3).max(120).optional(),
    gender: z.enum(['male', 'female']).nullable().optional(),
    birth_date: z.iso.date().nullable().optional(),
    phone: optionalText(20),
    address: optionalText(500),
    department_id: uuidSchema.nullable().optional(),
    position: optionalText(80),
    join_date: z.iso.date().nullable().optional(),
    employment_type: z.enum(['permanent', 'contract']).optional(),
    base_salary: z.coerce.number().min(0).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

/** PRD section 57: employee may only edit these fields. */
export const employeeSelfUpdateSchema = z
  .object({
    phone: optionalText(20),
    address: optionalText(500),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

export const profileSelfUpdateSchema = z
  .object({
    full_name: z.string().trim().min(3).max(120).optional(),
    avatar_url: z.url().max(500).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })

export const employeeQuerySchema = paginationSchema.extend({
  search: searchSchema,
  department_id: uuidSchema.optional(),
  status: z.enum(['active', 'inactive']).optional(),
  employment_type: z.enum(['permanent', 'contract']).optional(),
  sort: z.enum(['created_at', 'full_name', 'join_date', 'employee_code']).default('created_at'),
  order: sortOrderSchema,
})

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>
export type EmployeeSelfUpdateInput = z.infer<typeof employeeSelfUpdateSchema>
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>