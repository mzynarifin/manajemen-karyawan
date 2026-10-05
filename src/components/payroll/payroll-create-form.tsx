'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { CurrencyInput, Field, Select } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { createPayrollAction } from '@/features/payroll/actions'
import { formatCurrency } from '@/lib/formatters'

const schema = z.object({
  employee_id: z.string().min(1, 'Select an employee.'),
  period_month: z.string().min(1),
  period_year: z.string().min(1),
  base_salary: z.string().min(1, 'Base salary is required.'),
  allowance: z.string().optional(),
  bonus: z.string().optional(),
  deduction: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(Date.UTC(2024, index, 1))),
}))

const YEARS = [2026, 2025, 2024]

type Props = {
  employees: Array<{ id: string; full_name: string; employee_code: string; base_salary: number }>
  defaultEmployeeId?: string
}

/** PRD section 34: preview is a helper, the backend decides the final number. */
export function PayrollCreateForm({ employees, defaultEmployeeId }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const now = new Date()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: defaultEmployeeId ?? '',
      period_month: String(now.getMonth() + 1),
      period_year: String(now.getFullYear()),
    },
  })

  const values = useWatch({ control })
  const selected = employees.find((employee) => employee.id === values.employee_id)

  const netSalary = useMemo(() => {
    const base = Number(values.base_salary || 0)
    const allowance = Number(values.allowance || 0)
    const bonus = Number(values.bonus || 0)
    const deduction = Number(values.deduction || 0)
    return base + allowance + bonus - deduction
  }, [values.base_salary, values.allowance, values.bonus, values.deduction])

  function onSubmit(input: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await createPayrollAction(input)

      if (result.ok) {
        toast.push(result.message)
        router.push('/admin/payroll')
        return
      }

      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormValues, { message })
        }
      }
      setServerError(result.message)
      toast.push(result.message, 'error')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Payroll Period</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Employee" required error={errors.employee_id?.message}>
            {(props) => (
              <Select
                {...props}
                defaultValue={defaultEmployeeId ?? ''}
                {...register('employee_id', {
                  onChange: (event) => {
                    const employee = employees.find((item) => item.id === (event.target.value as string))
                    if (employee) setValue('base_salary', String(employee.base_salary))
                  },
                })}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} ({employee.employee_code})
                  </option>
                ))}
              </Select>
            )}
          </Field>

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
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Amounts</h2>
          {selected && <p className="text-[13px] text-muted">Base salary filled from the employee record</p>}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Base Salary" required error={errors.base_salary?.message}>
            {(props) => (
              <CurrencyInput
                {...props}
                value={values.base_salary ?? ''}
                onValueChange={(value) => setValue('base_salary', value)}
              />
            )}
          </Field>

          <Field label="Allowance" error={errors.allowance?.message}>
            {(props) => (
              <CurrencyInput
                {...props}
                value={values.allowance ?? ''}
                onValueChange={(value) => setValue('allowance', value)}
              />
            )}
          </Field>

          <Field label="Bonus" error={errors.bonus?.message}>
            {(props) => (
              <CurrencyInput
                {...props}
                value={values.bonus ?? ''}
                onValueChange={(value) => setValue('bonus', value)}
              />
            )}
          </Field>

          <Field label="Deduction" error={errors.deduction?.message}>
            {(props) => (
              <CurrencyInput
                {...props}
                value={values.deduction ?? ''}
                onValueChange={(value) => setValue('deduction', value)}
              />
            )}
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-[13px] font-medium text-muted">Net Salary (preview)</span>
          <span className="text-xl font-semibold tabular-nums text-ink">{formatCurrency(netSalary)}</span>
        </div>
        {netSalary < 0 && (
          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
            Deduction is larger than the earnings. The backend will reject this.
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
        <Button type="submit" loading={pending} disabled={netSalary < 0}>
          {pending ? 'Creating...' : 'Create Payroll'}
        </Button>
      </div>
    </form>
  )
}