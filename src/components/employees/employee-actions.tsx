'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, MoreHorizontal, Pencil, UserMinus, UserPlus } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { setEmployeeStatusAction } from '@/features/employees/actions'

/** PRD section 21: row action dropdown. */
export function EmployeeActions({ employeeId, status }: { employeeId: string; status: string }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const toast = useToast()

  const isActive = status === 'active'

  function toggleStatus() {
    startTransition(async () => {
      const result = await setEmployeeStatusAction(employeeId, isActive ? 'inactive' : 'active')
      toast.push(result.message, result.ok ? 'success' : 'error')
      if (result.ok) {
        setConfirming(false)
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Row actions"
        aria-expanded={open}
        className="rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-30 mt-1 w-48 animate-slide-up rounded-lg border border-line bg-surface py-1 shadow-pop">
            <Link
              href={`/admin/employees/${employeeId}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-ink transition-colors duration-150 hover:bg-canvas"
            >
              <Eye className="h-3.5 w-3.5 text-muted" aria-hidden />
              View Details
            </Link>
            <Link
              href={`/admin/employees/${employeeId}?edit=1`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-ink transition-colors duration-150 hover:bg-canvas"
            >
              <Pencil className="h-3.5 w-3.5 text-muted" aria-hidden />
              Edit Employee
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setConfirming(true)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink transition-colors duration-150 hover:bg-canvas"
            >
              {isActive ? (
                <>
                  <UserMinus className="h-3.5 w-3.5 text-muted" aria-hidden />
                  Deactivate Employee
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 text-muted" aria-hidden />
                  Reactivate Employee
                </>
              )}
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={toggleStatus}
        loading={pending}
        destructive={isActive}
        title={isActive ? 'Deactivate employee?' : 'Reactivate employee?'}
        description={
          isActive
            ? 'The account will be blocked from signing in. Payroll, attendance and leave history stay available.'
            : 'The account will be able to sign in again.'
        }
        confirmLabel={isActive ? 'Deactivate' : 'Reactivate'}
      />
    </div>
  )
}