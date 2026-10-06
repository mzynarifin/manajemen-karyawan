import { z } from 'zod'
import { initialSchema, paginationSchema, searchSchema, sortOrderSchema, uuidSchema } from '@/lib/validations/common'

const optionalText = (max: number) => z.string().trim().max(max).optional()

/** "08:00" — Postgres time columns come back as "08:00:00", normalised on read. */
const clockSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time like 08:00.')
  .nullable()
  .optional()

const breakSchema = z.coerce.number().int().min(0).max(480).default(0)

/** Both ends of the shift or neither, and it has to end after it starts. */
function workHoursOk(value: { work_start?: string | null; work_end?: string | null }) {
  const hasStart = Boolean(value.work_start)
  const hasEnd = Boolean(value.work_end)
  if (hasStart !== hasEnd) return false
  if (!hasStart || !hasEnd) return true
  return value.work_end! > value.work_start!
}

const WORK_HOURS_ERROR = { message: 'Set both shift times, and the end must be after the start.', path: ['work_end'] }

export const employeeCreateSchema = z
  .object({
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
    work_start: clockSchema,
    work_end: clockSchema,
    break_minutes: breakSchema,
  })
  .refine(workHoursOk, WORK_HOURS_ERROR)

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
    work_start: clockSchema,
    work_end: clockSchema,
    break_minutes: z.coerce.number().int().min(0).max(480).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' })
  .refine(workHoursOk, WORK_HOURS_ERROR)

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
  initial: initialSchema,
  sort: z.enum(['created_at', 'full_name', 'join_date', 'employee_code']).default('created_at'),
  order: sortOrderSchema,
})

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>
export type EmployeeSelfUpdateInput = z.infer<typeof employeeSelfUpdateSchema>
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>