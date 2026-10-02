'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { publishPayrollAction } from '@/features/payroll/actions'
import type { PayrollRow } from '@/features/payroll/queries'

/** PRD section 35: draft can edit + publish, published opens the payslip. */
export function PayrollRowActions({ payroll }: { payroll: PayrollRow }) {
  const [confirming, setConfirming] = useState(false)

  if (payroll.status === 'published') {
    return (
      <Link href={`/admin/payroll/${payroll.id}`}>
        <Button variant="ghost" size="sm">
          View Payslip
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex justify-end gap-1.5">
      <Link href={`/admin/payroll/${payroll.id}`}>
        <Button variant="secondary" size="sm">
          Edit
        </Button>
      </Link>
      <PublishPayrollButton payrollId={payroll.id} onOpenChange={setConfirming} />
    </div>
  )
}

/** Publish with confirmation (PRD section 36). */
export function PublishPayrollButton({
  payrollId,
  onOpenChange,
}: {
  payrollId: string
  onOpenChange?: (open: boolean) => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function publish() {
    startTransition(async () => {
      const result = await publishPayrollAction(payrollId)
      toast.push(result.message, result.ok ? 'success' : 'error')
      if (result.ok) {
        setConfirming(false)
        onOpenChange?.(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setConfirming(true)}>
        Publish
      </Button>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={publish}
        loading={pending}
        title="Publish payroll?"
        description="Once published, this payroll will be visible to the employee and can no longer be edited."
        confirmLabel="Publish Payroll"
      />
    </>
  )
}