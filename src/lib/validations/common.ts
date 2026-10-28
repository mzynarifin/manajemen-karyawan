import { z } from 'zod'
import { DEFAULT_LIMIT, MAX_LIMIT } from '@/lib/utils/query'

export const uuidSchema = z.uuid()

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc')

export const searchSchema = z.string().trim().min(1).max(120).optional()

/** Ids arrive as strings and must be validated before any query. */
export function parseId(value: string): string {
  return uuidSchema.parse(value)
}