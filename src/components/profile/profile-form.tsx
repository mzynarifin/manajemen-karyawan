'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { updateEmployeeProfileAction, updateProfileAction } from '@/features/profile/actions'

const profileSchema = z.object({
  full_name: z.string().min(3, 'Name is required.'),
  avatar_url: z.union([z.url('Enter a valid URL.'), z.literal('')]).optional(),
})

const contactSchema = z.object({
  phone: z.string().max(20, 'Phone is too long.').optional(),
  address: z.string().max(500, 'Address is too long.').optional(),
})

type ProfileValues = z.infer<typeof profileSchema>
type ContactValues = z.infer<typeof contactSchema>

type Props = {
  role: 'admin' | 'employee'
  defaults: { full_name: string; avatar_url: string; phone: string; address: string }
}

/** PRD section 53: employees only edit what the backend allows. */
export function ProfileForm({ role, defaults }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: defaults.full_name, avatar_url: defaults.avatar_url },
  })

  const contact = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { phone: defaults.phone, address: defaults.address },
  })

  function report(result: { ok: true; message: string } | { ok: false; message: string }) {
    toast.push(result.message, result.ok ? 'success' : 'error')
    setServerError(result.ok ? null : result.message)
    if (result.ok) router.refresh()
  }

  function saveProfile(values: ProfileValues) {
    setServerError(null)
    startTransition(async () => {
      report(await updateProfileAction({ full_name: values.full_name, avatar_url: values.avatar_url || null }))
    })
  }

  function saveContact(values: ContactValues) {
    setServerError(null)
    startTransition(async () => {
      report(await updateEmployeeProfileAction(values))
    })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">Account</h2>
        <p className="mt-0.5 text-[13px] text-muted">Name and avatar are used across the app.</p>

        <form onSubmit={profile.handleSubmit(saveProfile)} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required error={profile.formState.errors.full_name?.message}>
            {(props) => <Input {...props} {...profile.register('full_name')} />}
          </Field>

          <Field
            label="Avatar URL"
            hint="Optional image link."
            error={profile.formState.errors.avatar_url?.message}
          >
            {(props) => <Input {...props} placeholder="https://..." {...profile.register('avatar_url')} />}
          </Field>

          <div className="sm:col-span-2">
            <Button type="submit" loading={pending}>
              Save Account
            </Button>
          </div>
        </form>
      </section>

      {role === 'employee' && (
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-ink">Contact</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Only phone and address are editable. Employment details are managed by HR.
          </p>

          <form onSubmit={contact.handleSubmit(saveContact)} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Phone" error={contact.formState.errors.phone?.message}>
              {(props) => <Input {...props} placeholder="08xxxxxxxxxx" {...contact.register('phone')} />}
            </Field>

            <Field label="Address" error={contact.formState.errors.address?.message}>
              {(props) => <Textarea {...props} rows={2} {...contact.register('address')} />}
            </Field>

            <div className="sm:col-span-2">
              <Button type="submit" loading={pending}>
                Save Contact
              </Button>
            </div>
          </form>
        </section>
      )}

      {serverError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {serverError}
        </p>
      )}
    </div>
  )
}