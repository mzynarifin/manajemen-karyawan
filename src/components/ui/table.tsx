import type { ReactNode } from 'react'

type SortState = { column: string; order: 'asc' | 'desc' }

export type Column<T> = {
  key: string
  header: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
  cell: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort?: SortState
  empty?: ReactNode
  className?: string
}

/**
 * PRD section 22: minimal borders, subtle header, light row hover,
 * horizontal scroll on mobile instead of turning rows into cards.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  empty,
  className = '',
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-canvas/60">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                aria-sort={
                  sort?.column === column.key
                    ? sort.order === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                className={`whitespace-nowrap px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide text-muted ${
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                }`}
              >
                {column.sortable && sort?.column === column.key ? (
                  <span className="inline-flex items-center gap-1 text-ink">
                    {column.header}
                    <span aria-hidden>{sort.order === 'asc' ? '↑' : '↓'}</span>
                  </span>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors duration-150 hover:bg-canvas/70">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap px-5 py-3 text-[13px] text-ink ${
                    column.align === 'right' ? 'text-right tabular-nums' : column.align === 'center' ? 'text-center' : ''
                  }`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}