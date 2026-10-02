import Link from 'next/link'

type Props = {
  page: number
  limit: number
  total: number
  /** Describes what is listed, e.g. "employees". */
  label: string
  buildHref: (page: number) => string
}

/** PRD section 69: Showing 1-20 of 126 employees + Previous / page / Next. */
export function Pagination({ page, limit, total, label, buildHref }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const pages = pageWindow(page, totalPages)

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