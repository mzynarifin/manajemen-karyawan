'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

/** Date range filter that keeps the other filters in the URL. */
export function DateRangeFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const from = params.get('date_from') ?? ''
  const to = params.get('date_to') ?? ''
  const [fromValue, setFromValue] = useState(from)
  const [toValue, setToValue] = useState(to)

  useEffect(() => setFromValue(from), [from])
  useEffect(() => setToValue(to), [to])

  function apply(nextFrom: string, nextTo: string) {
    const next = new URLSearchParams(params.toString())
    if (nextFrom) next.set('date_from', nextFrom)
    else next.delete('date_from')
    if (nextTo) next.set('date_to', nextTo)
    else next.delete('date_to')
    next.delete('page')

    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <label className="text-[13px]">
        <span className="field-label">Date from</span>
        <input
          type="date"
          value={fromValue}
          onChange={(event) => {
            setFromValue(event.target.value)
            apply(event.target.value, toValue)
          }}
          disabled={pending}
          className="field-control mt-1 h-9 w-40"
        />
      </label>

      <label className="text-[13px]">
        <span className="field-label">Date to</span>
        <input
          type="date"
          value={toValue}
          onChange={(event) => {
            setToValue(event.target.value)
            apply(fromValue, event.target.value)
          }}
          disabled={pending}
          className="field-control mt-1 h-9 w-40"
        />
      </label>

      {(from || to) && (
        <button
          type="button"
          onClick={() => apply('', '')}
          className="h-9 rounded-md px-2 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
        >
          Clear dates
        </button>
      )}
    </div>
  )
}