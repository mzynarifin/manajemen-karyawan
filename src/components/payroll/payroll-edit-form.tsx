'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CurrencyInput, Field } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { updatePayrollAction } from '@/features/payroll/actions'
import { formatCurrency } from '@/lib/formatters'

type Props = {
  payroll: {
    id: string
    base_salary: number
    allowance: number
    bonus: number
    deduction: number
  }
}

/** Draft payroll editing: amounts only, period is immutable once created. */
export function PayrollEditForm({ payroll }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState({
    base_salary: String(payroll.base_salary ?? 0),
    allowance: String(payroll.allowance ?? 0),
    bonus: String(payroll.bonus ?? 0),
    deduction: String(payroll.deduction ?? 0),
  })

  const net =
    Number(values.base_salary || 0) +
    Number(values.allowance || 0) +
    Number(values.bonus || 0) -
    Number(values.deduction || 0)

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await updatePayrollAction(payroll.id, values)

      if (result.ok) {
        toast.push(result.message)
        router.refresh()
        return
      }

      setError(result.message)
      toast.push(result.message, 'error')
    })
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-[15px] font-semibold text-ink">Edit Draft</h2>
      <p className="mt-0.5 text-[13px] text-muted">Amounts only. The period cannot be changed after creation.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(['base_salary', 'allowance', 'bonus', 'deduction'] as const).map((field) => (
          <Field key={field} label={field.replace('_', ' ').replace(/^./, (c) => c.toUpperCase())}>
            {(props) => (
              <CurrencyInput
                {...props}
                value={values[field]}
                onValueChange={(value) => setValues((current) => ({ ...current, [field]: value }))}
              />
            )}
          </Field>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="text-[13px] font-medium text-muted">Net Salary (preview)</p>
          <p className="text-xl font-semibold tabular-nums text-ink">{formatCurrency(net)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.refresh()} disabled={pending}>
            Reset
          </Button>
          <Button onClick={save} loading={pending} disabled={net < 0}>
            {pending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
    </section>
  )
}