'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

type Props = {
  /** Letters that actually have employees; the rest render disabled. */
  available?: string[]
  /** Label for the "clear the filter" link. */
  label?: string
}

/**
 * Jump to employees by first letter. Lives in the URL as ?initial=A so it
 * survives a reload, can be shared, and keeps working with pagination. The page
 * parameter is dropped on change because the result set is a different one.
 */
export function EmployeeIndexNav({ available, label = 'All' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const active = params.get('initial')?.toUpperCase() ?? ''
  const has = available ? new Set(available.map((letter) => letter.toUpperCase())) : null

  function select(letter: string) {
    const next = new URLSearchParams(params.toString())
    if (letter) next.set('initial', letter)
    else next.delete('initial')
    next.delete('page')

    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    })
  }

  return (
    <nav aria-label="Jump to letter" className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-[13px] text-muted">Name</span>

      <button
        type="button"
        onClick={() => select('')}
        disabled={pending}
        aria-current={active ? undefined : 'true'}
        className={`h-8 rounded-md px-2.5 text-[13px] transition-colors duration-150 ${
          active
            ? 'text-muted hover:bg-canvas hover:text-ink'
            : 'bg-brand-700 font-medium text-white'
        }`}
      >
        {label}
      </button>

      {LETTERS.map((letter) => {
        const empty = has ? !has.has(letter) : false
        const isActive = active === letter

        return (
          <button
            key={letter}
            type="button"
            onClick={() => select(letter)}
            disabled={pending || empty}
            aria-current={isActive ? 'true' : undefined}
            title={empty ? `No employee starts with ${letter}` : `Show names starting with ${letter}`}
            className={`h-8 w-8 rounded-md text-[13px] tabular-nums transition-colors duration-150 ${
              isActive
                ? 'bg-brand-700 font-medium text-white'
                : empty
                  ? 'cursor-not-allowed text-muted/40'
                  : 'text-muted hover:bg-canvas hover:text-ink'
            }`}
          >
            {letter}
          </button>
        )
      })}
    </nav>
  )
}
