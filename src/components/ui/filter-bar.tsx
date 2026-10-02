'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { SlidersHorizontal } from 'lucide-react'

type FilterOption = { value: string; label: string }

type FilterProps = {
  /** name -> options; the first option with value "" is the "All" reset. */
  options: Record<string, FilterOption[]>
  className?: string
}

/** PRD section 68: shows Filters (2) when active, resets page on change. */
export function FilterBar({ options, className = '' }: FilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const activeCount = Object.keys(options).filter((name) => params.get(name)).length

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(name, value)
    else next.delete(name)
    next.delete('page')

    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    })
  }

  function reset() {
    const next = new URLSearchParams(params.toString())
    for (const name of Object.keys(options)) next.delete(name)
    next.delete('page')

    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    })
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        {activeCount > 0 ? `Filters (${activeCount})` : 'Filters'}
      </span>

      {Object.entries(options).map(([name, items]) => (
        <select
          key={name}
          aria-label={`Filter by ${name.replace(/_/g, ' ')}`}
          value={params.get(name) ?? ''}
          onChange={(event) => update(name, event.target.value)}
          disabled={pending}
          className={`h-9 rounded-md border bg-surface pl-3 pr-8 text-[13px] transition-colors duration-150
            focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 ${
              params.get(name) ? 'border-brand-600 font-medium text-ink' : 'border-line text-muted'
            }`}
        >
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      ))}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={reset}
          className="h-9 rounded-md px-2 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
        >
          Reset
        </button>
      )}
    </div>
  )
}