'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { checkInAction, checkOutAction } from '@/features/attendance/actions'

type TodayAttendance = {
  id: string
  check_in: string
  check_out: string | null
  working_minutes: number | null
  status: string
} | null

/** PRD section 46-47: one button at a time, state decides which. */
export function AttendanceActions({ attendance }: { attendance: TodayAttendance }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()

  if (!attendance) {
    return (
      <Button
        size="sm"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await checkInAction()
            toast.push(result.message, result.ok ? 'success' : 'error')
            if (result.ok) router.refresh()
          })
        }
      >
        <LogIn className="h-4 w-4" aria-hidden />
        Check In
      </Button>
    )
  }

  if (attendance.check_out) {
    return <span className="text-[13px] text-muted">Completed for today</span>
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await checkOutAction()
          toast.push(result.message, result.ok ? 'success' : 'error')
          if (result.ok) router.refresh()
        })
      }
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Check Out
    </Button>
  )
}