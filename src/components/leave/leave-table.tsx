'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type Column } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Field, Textarea } from '@/components/ui/field'
import { EmptyState } from '@/components/ui/states'
import { useToast } from '@/components/ui/toast'
import { approveLeaveAction, rejectLeaveAction } from '@/features/leave/actions'
import { formatDate, formatDateTime, labelOf, pluralDays } from '@/lib/formatters'
import type { LeaveRow } from '@/features/leave/queries'

const columns: Column<LeaveRow>[] = [
  { key: 'employee', header: 'Employee', cell: (row) => row.employees.full_name },
  { key: 'type', header: 'Type', cell: (row) => labelOf(row.leave_type) },
  { key: 'start', header: 'Start Date', cell: (row) => formatDate(row.start_date) },
  { key: 'end', header: 'End Date', cell: (row) => formatDate(row.end_date) },
  { key: 'duration', header: 'Duration', align: 'right', cell: (row) => pluralDays(row.total_days) },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
  { key: 'submitted', header: 'Submitted', cell: (row) => formatDateTime(row.created_at) },
  { key: 'action', header: 'Action', align: 'right', cell: (row) => <RowActions leave={row} /> },
]

function RowActions({ leave }: { leave: LeaveRow }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)

  if (leave.status !== 'pending') {
    return (
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setDetailOpen(true)}>
          Details
        </Button>
      </div>
    )
  }

  function approve() {
    startTransition(async () => {
      const result = await approveLeaveAction(leave.id)
      toast.push(result.message, result.ok ? 'success' : 'error')
      if (result.ok) {
        setApproving(false)
        router.refresh()
      }
    })
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectLeaveAction(leave.id, reason)
      toast.push(result.message, result.ok ? 'success' : 'error')
      if (result.ok) {
        setRejecting(false)
        setReason('')
        router.refresh()
      }
    })
  }

  return (
    <div className="flex justify-end gap-1.5">
      <Button variant="ghost" size="sm" onClick={() => setDetailOpen(true)}>
        Details
      </Button>
      <Button size="sm" onClick={() => setApproving(true)}>
        Approve
      </Button>
      <Button variant="destructive" size="sm" onClick={() => setRejecting(true)}>
        Reject
      </Button>

      <ConfirmDialog
        open={approving}
        onClose={() => setApproving(false)}
        onConfirm={approve}
        loading={pending}
        title="Approve leave request?"
        description="This will approve the request and update the employee's leave balance."
        confirmLabel="Approve Leave"
      />

      <Dialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject leave request"
        description="The employee will see this reason on their request."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={reject} loading={pending} disabled={reason.trim().length < 3}>
              Reject Leave
            </Button>
          </>
        }
      >
        <Field label="Rejection Reason" required>
          {(props) => (
            <Textarea
              {...props}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why this request cannot be approved"
            />
          )}
        </Field>
      </Dialog>

      <LeaveDetailDialog leave={leave} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  )
}

/** PRD section 29: everything HR needs before deciding. */
function LeaveDetailDialog({
  leave,
  open,
  onClose,
}: {
  leave: LeaveRow
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Leave request detail" size="md">
      <dl className="space-y-2 text-[13px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Employee</dt>
          <dd className="font-medium text-ink">
            {leave.employees.full_name} ({leave.employees.employee_code})
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Leave Type</dt>
          <dd className="font-medium text-ink">{labelOf(leave.leave_type)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Date Range</dt>
          <dd className="font-medium text-ink">
            {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Duration</dt>
          <dd className="font-medium text-ink">{pluralDays(leave.total_days)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Submitted At</dt>
          <dd className="font-medium text-ink">{formatDateTime(leave.created_at)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd>
            <StatusBadge value={leave.status} />
          </dd>
        </div>
        <div className="pt-2">
          <dt className="text-muted">Reason</dt>
          <dd className="mt-1 text-ink">{leave.reason}</dd>
        </div>
        {leave.rejection_reason && (
          <div className="pt-2">
            <dt className="text-muted">Rejection Reason</dt>
            <dd className="mt-1 text-ink">{leave.rejection_reason}</dd>
          </div>
        )}
      </dl>
    </Dialog>
  )
}

export function LeaveTable({ rows }: { rows: LeaveRow[] }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      empty={
        <EmptyState
          title="No leave requests"
          description="Requests submitted by employees will appear here."
        />
      }
    />
  )
}