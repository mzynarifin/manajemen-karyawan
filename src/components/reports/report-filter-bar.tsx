'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

type Query = Record<string, string | number | undefined>

type Option = { value: string; label: string }

type Control = { name: string; label: string; options?: Option[] }

type Props = {
  type: string
  current: Query
  basePath: string
}

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(Date.UTC(2024, index, 1))),
}))

/** Current year plus the three before it, so the list never goes stale. */
function years() {
  const thisYear = new Date().getFullYear()
  return [0, 1, 2, 3].map((offset) => String(thisYear - offset))
}

/** Only the filters that make sense for the active report tab. */
function controlsFor(type: string): Control[] {
  if (type === 'attendance') {
    return [
      { name: 'date_from', label: 'Date from' },
      { name: 'date_to', label: 'Date to' },
    ]
  }

  if (type === 'leave') {
    return [
      { name: 'date_from', label: 'Date from' },
      { name: 'date_to', label: 'Date to' },
      {
        name: 'leave_type',
        label: 'Leave type',
        options: [
          { value: '', label: 'All types' },
          { value: 'annual', label: 'Annual' },
          { value: 'sick', label: 'Sick' },
          { value: 'personal', label: 'Personal' },
        ],
      },
    ]
  }

  if (type === 'payroll') {
    return [
      { name: 'period_month', label: 'Month', options: [{ value: '', label: 'All months' }, ...MONTHS] },
      {
        name: 'period_year',
        label: 'Year',
        options: [{ value: '', label: 'All years' }, ...years().map((year) => ({ value: year, label: year }))],
      },
    ]
  }

  return []
}

export function ReportFilterBar({ type, current, basePath }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(name, value)
    else next.delete(name)

    startTransition(() => router.replace(`${basePath}?${next.toString()}`, { scroll: false }))
  }

  const controls = controlsFor(type)
  if (controls.length === 0) return null

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface px-5 py-4">
      {controls.map((control) => (
        <label key={control.name} className="text-[13px]">
          <span className="field-label">{control.label}</span>
          {control.options ? (
            <select
              value={current[control.name] ?? ''}
              onChange={(event) => update(control.name, event.target.value)}
              disabled={pending}
              className="field-control mt-1 h-9 w-44"
            >
              {control.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              value={current[control.name] ?? ''}
              onChange={(event) => update(control.name, event.target.value)}
              disabled={pending}
              className="field-control mt-1 h-9 w-40"
            />
          )}
        </label>
      ))}
    </div>
  )
}
