'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { loginAction } from '@/features/auth/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

const schema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  function onSubmit(values: FormValues) {
    setError(null)
    startTransition(async () => {
      const result = await loginAction(values.email, values.password)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Email" error={errors.email?.message}>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="email"
            placeholder="you@sentraakarya.test"
            {...register('email')}
          />
        )}
      </Field>

      <Field label="Password" error={errors.password?.message}>
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors duration-150 hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        )}
      </Field>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      <Button type="submit" loading={pending} className="w-full">
        {pending ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}