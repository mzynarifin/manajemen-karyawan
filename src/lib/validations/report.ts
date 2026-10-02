import { z } from 'zod'

export const reportQuerySchema = z.object({
  type: z.enum(['employee', 'attendance', 'leave', 'payroll']),
  department_id: z.uuid().optional(),
  employee_id: z.uuid().optional(),
  date_from: z.iso.date().optional(),
  date_to: z.iso.date().optional(),
  period_month: z.coerce.number().int().min(1).max(12).optional(),
  period_year: z.coerce.number().int().min(2000).max(2100).optional(),
  leave_type: z.enum(['annual', 'sick', 'personal']).optional(),
})