'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { CurrencyInput, Field, Input, Select } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { createPayrollBatchAction, type PayrollBatchItem } from '@/features/payroll/actions'
import { formatCurrency } from '@/lib/formatters'

const schema = z.object({
  period_month: z.string().min(1, 'Month is required.'),
  period_year: z.string().min(1, 'Year is required.'),
})

type FormValues = z.infer<typeof schema>

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(Date.UTC(2024, index, 1))),
}))

const YEARS = [2026, 2025, 2024]

type EmployeeOption = {
  id: string
  full_name: string
  employee_code: string
  position: string | null
  base_salary: number
}

/** What HR types for one person: amounts are entered as digits only. */
type Row = { base_salary: string; allowance: string; bonus: string; deduction: string }

type Props = {
  employees: EmployeeOption[]
  defaultEmployeeId?: string
}

type BatchSummary = {
  created: Array<{ employee_id: string; employee_code: string; full_name: string }>
  skipped: Array<{ employee_id: string; employee_code: string; full_name: string }>
}

function emptyRow(employee: EmployeeOption): Row {
  return {
    base_salary: String(employee.base_salary ?? 0),
    allowance: '',
    bonus: '',
    deduction: '',
  }
}

function rowNet(row: Row) {
  return (
    Number(row.base_salary || 0) +
    Number(row.allowance || 0) +
    Number(row.bonus || 0) -
    Number(row.deduction || 0)
  )
}

/** PRD section 34: pick many employees, one click, one row each with own amounts. */
export function PayrollCreateForm({ employees, defaultEmployeeId }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [search, setSearch] = useState('')
  // Amounts live outside react-hook-form: they are keyed by employee and must
  // survive ticking and unticking other people.
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      employees
        .filter((employee) => employee.id === defaultEmployeeId)
        .map((employee) => [employee.id, emptyRow(employee)]),
    ),
  )
  const now = new Date()

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      period_month: String(now.getMonth() + 1),
      period_year: String(now.getFullYear()),
    },
  })

  const selected = useMemo(
    () => employees.filter((employee) => employee.id in rows),
    [employees, rows],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return employees
    return employees.filter((employee) =>
      `${employee.full_name} ${employee.employee_code} ${employee.position ?? ''}`.toLowerCase().includes(term),
    )
  }, [employees, search])

  const totalNet = selected.reduce((sum, employee) => sum + rowNet(rows[employee.id]), 0)
  const negativeRows = selected.filter((employee) => rowNet(rows[employee.id]) < 0)

  function toggle(employee: EmployeeOption) {
    setRows((current) => {
      if (employee.id in current) {
        const next = { ...current }
        delete next[employee.id]
        return next
      }
      return { ...current, [employee.id]: emptyRow(employee) }
    })
  }

  function toggleAll() {
    setRows((current) => {
      const next = { ...current }
      const everyVisibleSelected = visible.length > 0 && visible.every((employee) => employee.id in next)
      for (const employee of visible) {
        if (everyVisibleSelected) delete next[employee.id]
        else next[employee.id] ??= emptyRow(employee)
      }
      return next
    })
  }

  function editRow(employeeId: string, field: keyof Row, value: string) {
    setRows((current) => ({ ...current, [employeeId]: { ...current[employeeId], [field]: value } }))
  }

  function onSubmit(values: FormValues) {
    setServerError(null)
    const items: PayrollBatchItem[] = selected.map((employee) => ({ employee_id: employee.id, ...rows[employee.id] }))

    startTransition(async () => {
      const result = await createPayrollBatchAction({ ...values, items })

      if (result.ok) {
        toast.push(result.message, 'success')
        setSummary(result.data as BatchSummary)
        router.refresh()
        return
      }

      setServerError(result.message)
      toast.push(result.message, 'error')
    })
  }

  if (summary) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="text-[15px] font-semibold text-ink">Payroll created as draft</h2>
          <p className="mt-1 text-[13px] text-muted">
            {`${summary.created.length} created, ${summary.skipped.length} skipped. Review each record before publishing.`}
          </p>

          {summary.created.length > 0 && (
            <ul className="mt-4 space-y-1 text-[13px] text-ink">
              {summary.created.map((employee) => (
                <li key={employee.employee_id} className="flex justify-between gap-4">
                  <span>
                    {employee.full_name} <span className="text-muted">({employee.employee_code})</span>
                  </span>
                  <span className="text-brand-700">Created</span>
                </li>
              ))}
            </ul>
          )}

          {summary.skipped.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-[13px] font-medium text-ink">Skipped, already paid for this period</p>
              <ul className="mt-2 space-y-1 text-[13px] text-muted">
                {summary.skipped.map((employee) => (
                  <li key={employee.employee_id}>
                    {employee.full_name} ({employee.employee_code})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link href="/admin/payroll">
            <Button variant="secondary">Back to Payroll</Button>
          </Link>
          <Button onClick={() => setSummary(null)}>Create Another Batch</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Employees</h2>
        <p className="mt-0.5 text-[13px] text-muted">
          Tick everyone to pay this period. Each one keeps their own base salary and gets their own allowance, bonus and
          deduction below. Employees who already have a payroll for this period are skipped.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, employee ID, position..."
            className="w-full max-w-xs"
            aria-label="Search employees"
          />
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-muted">{selected.length} selected</span>
            <button type="button" onClick={toggleAll} className="font-medium text-brand-700 hover:underline">
              {visible.length > 0 && visible.every((employee) => employee.id in rows)
                ? 'Clear visible'
                : 'Select all visible'}
            </button>
          </div>
        </div>

        <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-line">
          {visible.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted">No employee matches that search.</p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((employee) => {
                const checked = employee.id in rows
                return (
                  <li key={employee.id} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      id={`pick-${employee.id}`}
                      checked={checked}
                      onChange={() => toggle(employee)}
                      className="h-4 w-4 shrink-0 rounded border-line text-brand-700"
                    />
                    <label htmlFor={`pick-${employee.id}`} className="flex min-w-0 flex-1 cursor-pointer items-baseline justify-between gap-3">
                      <span className="truncate text-[13px] text-ink">
                        {employee.full_name}
                        <span className="ml-2 text-muted">{employee.employee_code}</span>
                      </span>
                      <span className="shrink-0 text-[13px] tabular-nums text-muted">
                        {formatCurrency(employee.base_salary)}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Payroll Period</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Month" required error={errors.period_month?.message}>
            {(props) => (
              <Select {...props} {...register('period_month')}>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Year" required error={errors.period_year?.message}>
            {(props) => (
              <Select {...props} {...register('period_year')}>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Amounts per Employee</h2>
        {selected.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">Tick at least one employee above to enter their amounts.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th scope="col" className="pb-2 pr-3 font-medium">Employee</th>
                  <th scope="col" className="pb-2 pr-3 font-medium">Base Salary</th>
                  <th scope="col" className="pb-2 pr-3 font-medium">Allowance</th>
                  <th scope="col" className="pb-2 pr-3 font-medium">Bonus</th>
                  <th scope="col" className="pb-2 pr-3 font-medium">Deduction</th>
                  <th scope="col" className="pb-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {selected.map((employee) => {
                  const row = rows[employee.id]
                  const net = rowNet(row)
                  return (
                    <tr key={employee.id}>
                      <th scope="row" className="py-2 pr-3 text-left font-normal">
                        <span className="block text-ink">{employee.full_name}</span>
                        <span className="block text-muted">{employee.employee_code}</span>
                      </th>
                      {(['base_salary', 'allowance', 'bonus', 'deduction'] as const).map((field) => (
                        <td key={field} className="py-2 pr-3">
                          <CurrencyInput
                            value={row[field]}
                            onValueChange={(value) => editRow(employee.id, field, value)}
                            aria-label={`${field} for ${employee.full_name}`}
                          />
                        </td>
                      ))}
                      <td
                        className={`py-2 text-right tabular-nums ${net < 0 ? 'font-semibold text-red-600 dark:text-red-400' : 'text-ink'}`}
                      >
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line">
                  <th scope="row" colSpan={5} className="py-3 pr-3 text-right font-medium text-muted">
                    {selected.length > 1 ? `Total for ${selected.length} employees` : 'Net Salary'}
                  </th>
                  <td className="py-3 text-right text-xl font-semibold tabular-nums text-ink">
                    {formatCurrency(totalNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {negativeRows.length > 0 && (
          <p className="mt-2 text-[13px] font-medium text-red-600 dark:text-red-400">
            {`Deduction is larger than the earnings for ${negativeRows.map((employee) => employee.full_name).join(', ')}. The backend will reject this.`}
          </p>
        )}
      </section>

      {serverError && (
        <p role="alert" className="alert-error">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/payroll')}>
          Cancel
        </Button>
        <Button type="submit" loading={pending} disabled={selected.length === 0 || negativeRows.length > 0}>
          {pending
            ? 'Creating...'
            : selected.length > 1
              ? `Create Payroll for ${selected.length} Employees`
              : 'Create Payroll'}
        </Button>
      </div>
    </form>
  )
}
