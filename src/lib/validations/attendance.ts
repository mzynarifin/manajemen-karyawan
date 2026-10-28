import { z } from 'zod'
import { paginationSchema, uuidSchema } from '@/lib/validations/common'

export const attendanceQuerySchema = paginationSchema.extend({
  date_from: z.iso.date().optional(),
  date_to: z.iso.date().optional(),
  status: z.enum(['present', 'late', 'absent', 'leave']).optional(),
  department_id: uuidSchema.optional(),
  employee_id: uuidSchema.optional(),
  sort: z.enum(['attendance_date', 'created_at']).default('attendance_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>