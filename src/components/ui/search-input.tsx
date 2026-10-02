'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

type Props = {
  placeholder?: string
  paramName?: string
  className?: string
}

/**
 * PRD section 20 + 68: debounced search that writes to the URL, so results
 * stay shareable and the server component does the filtering.
 */
export function SearchInput({ placeholder = 'Search...', paramName = 'search', className = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const urlValue = params.get(paramName) ?? ''

  const [value, setValue] = useState(urlValue)

  useEffect(() => setValue(urlValue), [urlValue])

  useEffect(() => {
    if (value === urlValue) return

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(paramName, value)
      else next.delete(paramName)
      next.delete('page')
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    }, 350)

    return () => clearTimeout(timer)
  }, [value, urlValue, paramName, params, pathname, router])

  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field-control pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors duration-150 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}