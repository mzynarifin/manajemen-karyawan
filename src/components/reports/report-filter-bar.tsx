'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import type { z } from 'zod'
import type { reportQuerySchema } from '@/lib/validations/report'

type Query = z.infer<typeof reportQuerySchema>

type Option = { value: string; label: string }

type Props = {
  type: Query['type']
  current: Query
  departments?: Option[]
  employees?: Option[]
}

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(Date.UTC(2024, index, 1))),
}))

const YEARS = [2026, 2025, 2024].map((year) => ({ value: String(year), label: String(year) }))

/** Only the filters that make sense for the active report tab. */
export function ReportFilterBar({ type, current }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(name, value)
    else next.delete(name)

    startTransition(() => router.replace(`/admin/reports?${next.toString()}`, { scroll: false }))
  }

  const controls: Array<{ name: string; label: string; options: Option[] }> = []
  const values = current as unknown as Record<string, string | undefined>

  if (type === 'attendance') {
    controls.push(
      { name: 'date_from', label: 'Date from', options: [{ value: '', label: 'Any' }] },
      { name: 'date_to', label: 'Date to', options: [{ value: '', label: 'Any' }] },
    )
  }

  if (type === 'leave') {
    controls.push({
      name: 'leave_type',
      label: 'Leave type',
      options: [
        { value: '', label: 'All types' },
        { value: 'annual', label: 'Annual' },
        { value: 'sick', label: 'Sick' },
        { value: 'personal', label: 'Personal' },
      ],
    })
  }

  if (type === 'payroll') {
    controls.push(
      { name: 'period_month', label: 'Month', options: [{ value: '', label: 'All months' }, ...MONTHS] },
      { name: 'period_year', label: 'Year', options: [{ value: '', label: 'All years' }, ...YEARS] },
    )
  }

  if (controls.length === 0) return null

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface px-5 py-4">
      {controls.map((control) =>
        control.name === 'date_from' || control.name === 'date_to' ? (
          <label key={control.name} className="text-[13px]">
            <span className="field-label">{control.label}</span>
            <input
              type="date"
              value={values[control.name] ?? ''}
              onChange={(event) => update(control.name, event.target.value)}
              disabled={pending}
              className="field-control mt-1 h-9 w-40"
            />
          </label>
        ) : (
          <label key={control.name} className="text-[13px]">
            <span className="field-label">{control.label}</span>
            <select
              value={values[control.name] ?? ''}
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
          </label>
        ),
      )}
    </div>
  )
}