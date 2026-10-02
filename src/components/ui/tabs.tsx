import Link from 'next/link'

export type TabItem = { value: string; label: string; href: string }

/** Tabs as links so each tab has its own URL and works without JS state. */
export function Tabs({ items, active }: { items: TabItem[]; active: string }) {
  return (
    <div role="tablist" aria-label="Sections" className="flex gap-1 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const isActive = item.value === active
        return (
          <Link
            key={item.value}
            href={item.href}
            role="tab"
            aria-selected={isActive}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
              isActive
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-muted hover:border-line hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}