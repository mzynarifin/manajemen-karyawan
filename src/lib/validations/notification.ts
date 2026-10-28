import { z } from 'zod'
import { paginationSchema } from '@/lib/validations/common'
import type { NotificationType } from '@/types'

export const notificationQuerySchema = paginationSchema.extend({
  is_read: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  type: z.enum(['leave', 'payroll', 'employee', 'system']).optional(),
})

/**
 * The filter bar submits an empty string for "All", which the enum above
 * rejects, so page-level filters strip it before parsing.
 */
export const notificationFilterSchema = notificationQuerySchema.partial().extend({
  is_read: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  type: z.enum(['leave', 'payroll', 'employee', 'system']).optional(),
})

export type NotificationFilters = {
  isRead?: boolean
  type?: NotificationType
}

export function parseNotificationFilters(
  params: Record<string, string | string[] | undefined>,
): NotificationFilters {
  const cleaned = Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => typeof value === 'string' && value !== '')
      .map(([key, value]) => [key, value as string]),
  )

  const parsed = notificationFilterSchema.safeParse(cleaned)
  return parsed.success ? { isRead: parsed.data.is_read, type: parsed.data.type } : {}
}

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.string().trim().max(60).optional(),
  entity: z.string().trim().max(60).optional(),
  entity_id: z.uuid().optional(),
  user_id: z.uuid().optional(),
})