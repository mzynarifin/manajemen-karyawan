'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { submitLeaveAction } from '@/features/leave/actions'

const schema = z
  .object({
    leave_type: z.enum(['annual', 'sick', 'personal']),
    start_date: z.string().min(1, 'Start date is required.'),
    end_date: z.string().min(1, 'End date is required.'),
    reason: z.string().trim().min(5, 'Reason needs at least 5 characters.').max(1000),
  })
  .refine((value) => value.start_date <= value.end_date, {
    message: 'End date must be after start date.',
    path: ['end_date'],
  })

type FormValues = z.infer<typeof schema>

const FORM_ID = 'leave-request-form'

/** PRD section 49: total days and remaining balance preview before submit. */
export function LeaveRequestDialog({
  remaining,
  trigger,
}: {
  remaining: number | null
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { leave_type: 'annual', start_date: '', end_date: '', reason: '' },
  })

  const values = watch()

  const totalDays = useMemo(() => {
    if (!values.start_date || !values.end_date) return 0
    const start = Date.parse(`${values.start_date}T00:00:00Z`)
    const end = Date.parse(`${values.end_date}T00:00:00Z`)
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
    return Math.round((end - start) / 86_400_000) + 1
  }, [values.start_date, values.end_date])

  const exceedsBalance = values.leave_type === 'annual' && remaining !== null && totalDays > remaining

  function submitRequest(input: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await submitLeaveAction(input)

      if (result.ok) {
        toast.push(result.message)
        setOpen(false)
        reset()
        router.refresh()
        return
      }

      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof FormValues, { message })
        }
      }
      setServerError(result.message)
    })
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger ?? (
          <Button>
            <span>Request Leave</span>
          </Button>
        )}
      </span>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Request Leave"
        description="Your request will be reviewed by HR."
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              loading={pending}
              disabled={totalDays === 0 || exceedsBalance}
            >
              {pending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit(submitRequest)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Leave Type" required error={errors.leave_type?.message}>
              {(props) => (
                <Select {...props} {...register('leave_type')}>
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                </Select>
              )}
            </Field>

            <Field label="Total Days" hint="Counted in calendar days.">
              {(props) => (
                <input
                  {...props}
                  readOnly
                  value={totalDays > 0 ? `${totalDays} day${totalDays === 1 ? '' : 's'}` : '-'}
                  className="field-control bg-canvas text-muted"
                />
              )}
            </Field>

            <Field label="Start Date" required error={errors.start_date?.message}>
              {(props) => <Input {...props} type="date" {...register('start_date')} />}
            </Field>

            <Field label="End Date" required error={errors.end_date?.message}>
              {(props) => <Input {...props} type="date" {...register('end_date')} />}
            </Field>
          </div>

          <Field
            label="Reason"
            required
            error={errors.reason?.message}
            hint="Brief explanation helps HR decide faster."
          >
            {(props) => <Textarea {...props} {...register('reason')} />}
          </Field>

          {remaining !== null && (
            <p className={`text-[13px] ${exceedsBalance ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted'}`}>
              {exceedsBalance
                ? 'Requested leave exceeds your remaining balance.'
                : `Remaining balance after approval: ${Math.max(0, remaining - totalDays)} day(s).`}
            </p>
          )}

          {serverError && (
            <p role="alert" className="alert-error">
              {serverError}
            </p>
          )}
        </form>
      </Dialog>
    </>
  )
}