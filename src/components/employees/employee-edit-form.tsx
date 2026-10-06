'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { CurrencyInput, Field, Input, Select } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { updateEmployeeAction } from '@/features/employees/actions'
import { toClock } from '@/lib/utils/clock'

const schema = z.object({
  full_name: z.string().min(3, 'Full name is required.'),
  gender: z.union([z.enum(['male', 'female']), z.literal('')]).optional(),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  department_id: z.union([z.string(), z.literal('')]).optional(),
  position: z.string().optional(),
  join_date: z.string().optional(),
  employment_type: z.enum(['permanent', 'contract']),
  base_salary: z.string().optional(),
  work_start: z.string().optional(),
  work_end: z.string().optional(),
  break_minutes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  employee: {
    id: string
    full_name: string
    gender: string | null
    birth_date: string | null
    phone: string | null
    address: string | null
    department_id: string | null
    position: string | null
    join_date: string | null
    employment_type: string | null
    base_salary: number
    work_start: string | null
    work_end: string | null
    break_minutes: number
  }
  departments: Array<{ id: string; name: string }>
}

/** PRD section 25 + 57: HR edits everything except email and employee code. */
export function EmployeeEditForm({ employee, departments }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

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
      full_name: employee.full_name,
      gender: (employee.gender || '') as '' | 'male' | 'female',
      birth_date: employee.birth_date ?? undefined,
      phone: employee.phone ?? undefined,
      address: employee.address ?? undefined,
      department_id: employee.department_id ?? '',
      position: employee.position ?? '',
      join_date: employee.join_date ?? undefined,
      employment_type: (employee.employment_type ?? 'permanent') as 'permanent' | 'contract',
      base_salary: String(employee.base_salary ?? 0),
      work_start: toClock(employee.work_start) ?? '',
      work_end: toClock(employee.work_end) ?? '',
      break_minutes: employee.break_minutes ? String(employee.break_minutes) : '',
    },
  })

  const baseSalary = useWatch({ control, name: 'base_salary' })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await updateEmployeeAction(employee.id, {
        full_name: values.full_name,
        gender: values.gender || null,
        birth_date: values.birth_date || null,
        phone: values.phone,
        address: values.address,
        department_id: values.department_id || null,
        position: values.position,
        join_date: values.join_date || null,
        employment_type: values.employment_type,
        base_salary: baseSalary,
        work_start: values.work_start || null,
        work_end: values.work_end || null,
        break_minutes: values.break_minutes,
      })

      if (result.ok) {
        toast.push(result.message)
        router.push(`/admin/employees/${employee.id}`)
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-[15px] font-semibold text-ink">Edit Employee</h2>
      <p className="mt-0.5 text-[13px] text-muted">
        Email and employee ID are fixed after creation. Status changes are managed from the employee list. Empty
        shift times fall back to the company default.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" required error={errors.full_name?.message} className="sm:col-span-2">
          {(props) => <Input {...props} {...register('full_name')} />}
        </Field>

        <Field label="Gender" error={errors.gender?.message}>
          {(props) => (
            <Select {...props} defaultValue={employee.gender ?? ''} {...register('gender')}>
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          )}
        </Field>

        <Field label="Date of Birth" error={errors.birth_date?.message}>
          {(props) => <Input {...props} type="date" defaultValue={employee.birth_date ?? ''} {...register('birth_date')} />}
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          {(props) => <Input {...props} {...register('phone')} />}
        </Field>

        <Field label="Department" error={errors.department_id?.message}>
          {(props) => (
            <Select {...props} defaultValue={employee.department_id ?? ''} {...register('department_id')}>
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
          {(props) => <Input {...props} {...register('position')} />}
        </Field>

        <Field label="Join Date" error={errors.join_date?.message}>
          {(props) => <Input {...props} type="date" defaultValue={employee.join_date ?? ''} {...register('join_date')} />}
        </Field>

        <Field label="Employment Type" error={errors.employment_type?.message}>
          {(props) => (
            <Select {...props} defaultValue={employee.employment_type ?? 'permanent'} {...register('employment_type')}>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
            </Select>
          )}
        </Field>

        <Field label="Base Salary" error={errors.base_salary?.message}>
          {(props) => (
            <CurrencyInput {...props} value={baseSalary ?? ''} onValueChange={(value) => setValue('base_salary', value)} />
          )}
        </Field>

        <Field label="Shift Start" hint="Empty = company default." error={errors.work_start?.message}>
          {(props) => (
            <Input
              {...props}
              type="time"
              step={300}
              defaultValue={toClock(employee.work_start) ?? ''}
              {...register('work_start')}
            />
          )}
        </Field>

        <Field label="Shift End" error={errors.work_end?.message}>
          {(props) => (
            <Input {...props} type="time" step={300} defaultValue={toClock(employee.work_end) ?? ''} {...register('work_end')} />
          )}
        </Field>

        <Field label="Break (minutes)" error={errors.break_minutes?.message}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={0}
              max={480}
              step={5}
              defaultValue={employee.break_minutes ? String(employee.break_minutes) : ''}
              {...register('break_minutes')}
            />
          )}
        </Field>
      </div>

      {serverError && (
        <p role="alert" className="alert-error mt-4">
          {serverError}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <Link href={`/admin/employees/${employee.id}`}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
        <Button type="submit" loading={pending}>
          {pending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}