'use client'

import { Suspense, use } from 'react'

type Props = { count: Promise<number>; variant: 'header' | 'sidebar' }

function ResolvedBadge({ count, variant }: Props) {
  const unread = use(count)
  if (unread < 1) return null

  const label = `${unread} unread notifications`
  const badge =
    variant === 'header' ? (
      <span
        aria-hidden
        className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-medium leading-4 text-white"
      >
        {unread > 9 ? '9+' : unread}
      </span>
    ) : (
      <span
        aria-hidden
        className="rounded-full bg-brand-700 px-1.5 text-[11px] font-medium leading-4 text-white"
      >
        {unread}
      </span>
    )

  return (
    <>
      {badge}
      <span className="sr-only">{label}</span>
    </>
  )
}

/** Resolve notification counts inside a small boundary so the shell can stream. */
export function UnreadCountBadge({ count, variant }: Props) {
  return (
    <Suspense fallback={null}>
      <ResolvedBadge count={count} variant={variant} />
    </Suspense>
  )
}
