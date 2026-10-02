export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

export function range(page: number, limit: number) {
  const from = (page - 1) * limit
  return { from, to: from + limit - 1 }
}

export function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}

/**
 * Search terms reach PostgREST through .or() string syntax, so anything that
 * could terminate the value or inject another filter is stripped first.
 */
export function orSearch(columns: string[], value: string): string {
  const safe = value.replace(/[%_\\(),."']/g, '')
  return columns.map((column) => `${column}.ilike."%${safe}%"`).join(',')
}

/**
 * Whitelisted sort column, so a query param can never reach PostgREST
 * unchecked (PRD section 72).
 */
export function resolveSort(
  requested: string | undefined,
  order: 'asc' | 'desc' | undefined,
  allowed: string[],
  fallback: string,
) {
  const column = requested && allowed.includes(requested) ? requested : fallback
  return { column, order: order ?? ('desc' as const) }
}