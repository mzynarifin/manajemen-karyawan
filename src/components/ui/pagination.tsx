import Link from 'next/link'
import { paginationMeta } from '@/lib/utils/query'

export type PaginationParams = Record<string, string | string[] | undefined>

type Props = {
  page: number
  limit: number
  total: number
  /** Describes what is listed, e.g. "employees". */
  label: string
  /** Current route, e.g. "/admin/employees". */
  basePath: string
  /** The page's searchParams, so active filters survive a page change. */
  searchParams?: PaginationParams
}

/**
 * PRD section 69: Showing 1-20 of 126 employees + Previous / page / Next.
 * The hrefs are derived from basePath and the live filters, so every list page
 * does not have to re-implement the same "copy params, swap page" loop.
 */
export function Pagination({ page, limit, total, label, basePath, searchParams }: Props) {
  const { totalPages } = paginationMeta(page, limit, total)
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const pages = pageWindow(page, totalPages)
  const buildHref = (target: number) => pageHref(basePath, searchParams, target)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="text-[13px] text-muted">
        Showing <span className="font-medium text-ink">{from}</span>–
        <span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{total}</span> {label}
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="rounded-md border border-line px-2.5 py-1 text-[13px] text-ink transition-colors duration-150 hover:bg-canvas"
          >
            Previous
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-md border border-line px-2.5 py-1 text-[13px] text-muted/50">
            Previous
          </span>
        )}

        {pages.map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-[13px] text-muted">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(item)}
              aria-current={item === page ? 'page' : undefined}
              className={`min-w-8 rounded-md px-2 py-1 text-center text-[13px] transition-colors duration-150 ${
                item === page
                  ? 'bg-brand-700 font-medium text-white'
                  : 'border border-line text-ink hover:bg-canvas'
              }`}
            >
              {item}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="rounded-md border border-line px-2.5 py-1 text-[13px] text-ink transition-colors duration-150 hover:bg-canvas"
          >
            Next
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-md border border-line px-2.5 py-1 text-[13px] text-muted/50">
            Next
          </span>
        )}
      </nav>
    </div>
  )
}

/** Keeps every active filter, swaps only `page`. */
export function pageHref(
  basePath: string,
  searchParams: PaginationParams | undefined,
  page: number,
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (typeof value === 'string' && value && key !== 'page') query.set(key, value)
  }

  query.set('page', String(page))
  return `${basePath}?${query.toString()}`
}

function pageWindow(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages: Array<number | 'gap'> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) pages.push('gap')
  for (let current = start; current <= end; current += 1) pages.push(current)
  if (end < totalPages - 1) pages.push('gap')
  pages.push(totalPages)

  return pages
}