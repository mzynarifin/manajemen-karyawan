import { z } from 'zod'
import { paginationSchema } from '@/lib/validations/common'

export const notificationQuerySchema = paginationSchema.extend({
  is_read: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  type: z.enum(['leave', 'payroll', 'employee', 'system']).optional(),
})

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.string().trim().max(60).optional(),
  entity: z.string().trim().max(60).optional(),
  entity_id: z.uuid().optional(),
  user_id: z.uuid().optional(),
})