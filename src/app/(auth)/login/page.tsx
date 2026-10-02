import type { Metadata } from 'next'
import { redirectIfAuthenticated } from '@/lib/supabase/session'
import { LoginForm } from '@/features/auth/login-form'

export const metadata: Metadata = { title: 'Sign In' }

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">
            SK
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">HRIS PT Sentra Karya Digital</p>
            <p className="text-xs text-muted">Human Resource Information System</p>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6">
          <h1 className="text-lg font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-[13px] text-muted">Use your company email to continue.</p>

          <div className="mt-5">
            <LoginForm />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Access is limited to authorised accounts. Contact HR if you need an account.
        </p>
      </div>
    </main>
  )
}