'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { CurrencyInput, Field, Input, Select } from '@/components/ui/field'
import { createEmployeeAction } from '@/features/employees/actions'

const schema = z.object({
  full_name: z.string().min(3, 'Full name is required.'),
  email: z.email('Enter a valid email address.'),
  gender: z.enum(['male', 'female']).optional(),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  employee_code: z
    .string()
    .regex(/^EMP-\d{4,}$/, 'Use the format EMP-0001.')
    .optional()
    .or(z.literal('')),
  department_id: z.string().optional(),
  position: z.string().optional(),
  join_date: z.string().optional(),
  employment_type: z.enum(['permanent', 'contract']),
  base_salary: z.string().optional(),
  password: z.string().min(8, 'At least 8 characters.').optional().or(z.literal('')),
  work_start: z.string().optional(),
  work_end: z.string().optional(),
  break_minutes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

/** PRD section 23: one page, three sections, no card per input. */
export function EmployeeCreateForm({ departments }: { departments: Array<{ id: string; name: string }> }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employment_type: 'permanent' },
  })

  const baseSalary = useWatch({ control, name: 'base_salary' })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await createEmployeeAction({
        ...values,
        employee_code: values.employee_code || undefined,
        password: values.password || undefined,
        department_id: values.department_id || undefined,
        work_start: values.work_start || undefined,
        work_end: values.work_end || undefined,
        break_minutes: values.break_minutes || undefined,
      })

      if (result.ok) {
        const created = result.data as { temporary_password?: string } | undefined
        setTemporaryPassword(created?.temporary_password ?? null)
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

  if (temporaryPassword) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">Employee created</h2>
        <p className="mt-1 text-[13px] text-muted">
          Share this temporary password once. It is never stored by the app and will not be shown again.
        </p>
        <code className="mt-4 block rounded-md bg-canvas px-3 py-2 text-[13px] text-ink">{temporaryPassword}</code>
        <div className="mt-5 flex gap-2">
          <Link href="/admin/employees">
            <Button variant="secondary">Back to Employees</Button>
          </Link>
          <Button onClick={() => setTemporaryPassword(null)}>Add Another</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Personal Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required error={errors.full_name?.message} className="sm:col-span-2">
            {(props) => <Input {...props} placeholder="Full legal name" {...register('full_name')} />}
          </Field>

          <Field label="Gender" error={errors.gender?.message}>
            {(props) => (
              <Select {...props} defaultValue="" {...register('gender')}>
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            )}
          </Field>

          <Field label="Date of Birth" error={errors.birth_date?.message}>
            {(props) => <Input {...props} type="date" {...register('birth_date')} />}
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            {(props) => <Input {...props} placeholder="08xxxxxxxxxx" {...register('phone')} />}
          </Field>

          <Field label="Address" error={errors.address?.message}>
            {(props) => <Input {...props} placeholder="Street, city" {...register('address')} />}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Employment Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Employee ID"
            hint="Leave empty to generate the next ID automatically."
            error={errors.employee_code?.message}
          >
            {(props) => <Input {...props} placeholder="Auto (EMP-0001)" {...register('employee_code')} />}
          </Field>

          <Field label="Department" error={errors.department_id?.message}>
            {(props) => (
              <Select {...props} defaultValue="" {...register('department_id')}>
                <option value="">Unassigned</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Position" error={errors.position?.message}>
            {(props) => <Input {...props} placeholder="e.g. Backend Engineer" {...register('position')} />}
          </Field>

          <Field label="Join Date" error={errors.join_date?.message}>
            {(props) => <Input {...props} type="date" {...register('join_date')} />}
          </Field>

          <Field label="Employment Type" error={errors.employment_type?.message}>
            {(props) => (
              <Select {...props} defaultValue="permanent" {...register('employment_type')}>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
              </Select>
            )}
          </Field>

          <Field label="Base Salary" error={errors.base_salary?.message}>
            {(props) => (
              <CurrencyInput
                {...props}
                value={baseSalary ?? ''}
                onValueChange={(value) => setValue('base_salary', value)}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Working Hours</h2>
        <p className="mt-0.5 text-[13px] text-muted">
          Leave empty to use the company default shift. This decides when check-in counts as late and how many
          hours are worked.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Shift Start" error={errors.work_start?.message}>
            {(props) => <Input {...props} type="time" step={300} {...register('work_start')} />}
          </Field>

          <Field label="Shift End" error={errors.work_end?.message}>
            {(props) => <Input {...props} type="time" step={300} {...register('work_end')} />}
          </Field>

          <Field label="Break (minutes)" error={errors.break_minutes?.message}>
            {(props) => (
              <Input {...props} type="number" min={0} max={480} step={5} placeholder="60" {...register('break_minutes')} />
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Account Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Email" required error={errors.email?.message}>
            {(props) => <Input {...props} type="email" placeholder="name@sentraakarya.test" {...register('email')} />}
          </Field>

          <Field
            label="Initial Password"
            hint="Leave empty to generate a temporary password."
            error={errors.password?.message}
          >
            {(props) => <Input {...props} type="text" autoComplete="new-password" {...register('password')} />}
          </Field>
        </div>
      </section>

      {serverError && (
        <p role="alert" className="alert-error">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link href="/admin/employees">
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending}>
          {pending ? 'Creating...' : 'Create Employee'}
        </Button>
      </div>
    </form>
  )
}