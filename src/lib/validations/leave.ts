import { z } from 'zod'
import { paginationSchema, uuidSchema } from '@/lib/validations/common'

export const leaveCreateSchema = z
  .object({
    leave_type: z.enum(['annual', 'sick', 'personal']),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    reason: z.string().trim().min(5).max(1000),
  })
  .refine((value) => value.start_date <= value.end_date, {
    message: 'start_date must be before or equal to end_date',
    path: ['end_date'],
  })

export const leaveRejectSchema = z.object({
  reason: z.string().trim().min(3).max(500),
})

export const leaveQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  leave_type: z.enum(['annual', 'sick', 'personal']).optional(),
  employee_id: uuidSchema.optional(),
  date_from: z.iso.date().optional(),
  date_to: z.iso.date().optional(),
  sort: z.enum(['created_at', 'start_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const balanceQuerySchema = z.object({
  employee_id: uuidSchema.optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
})

export type LeaveCreateInput = z.infer<typeof leaveCreateSchema>
export type LeaveQuery = z.infer<typeof leaveQuerySchema>