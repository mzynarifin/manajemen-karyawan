import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'
import { EmployeeShell } from '@/components/layout/shell'
import { PageHeader, StatCard, StatGrid } from '@/components/ui/page-header'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/states'
import { LeaveRequestDialog } from '@/components/leave/leave-request-dialog'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { nowInAppTimezone } from '@/lib/utils/date'
import { formatDate, formatDateTime, labelOf, pluralDays } from '@/lib/formatters'
import { getLeaveBalance, listLeave, type LeaveRow } from '@/features/leave/queries'
import { leaveQuerySchema } from '@/lib/validations/leave'

export const metadata: Metadata = { title: 'My Leave' }

type Search = Record<string, string | string[] | undefined>

const columns: Column<LeaveRow>[] = [
  { key: 'type', header: 'Leave Type', cell: (row) => labelOf(row.leave_type) },
  {
    key: 'date',
    header: 'Date',
    cell: (row) => `${formatDate(row.start_date)} - ${formatDate(row.end_date)}`,
  },
  { key: 'duration', header: 'Duration', align: 'right', cell: (row) => pluralDays(row.total_days) },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
  { key: 'submitted', header: 'Submitted', cell: (row) => formatDateTime(row.created_at) },
]

export default async function EmployeeLeavePage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const session = await requireEmployeeSession()
  const params = await searchParams
  const query = leaveQuerySchema.parse(params)
  const today = nowInAppTimezone()

  const { data: employee } = await session.supabase
    .from('employees')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!employee) {
    return (
      <EmployeeShell title="Leave">
        <Card>
          <EmptyState title="No employee record" description="Contact HR to link your account." />
        </Card>
      </EmployeeShell>
    )
  }

  const [balance, records] = await Promise.all([
    getLeaveBalance(session.supabase, employee.id, today.year),
    listLeave(session.supabase, { ...query, limit: 20 }, { employeeId: employee.id }).catch(() => null),
  ])

  return (
    <EmployeeShell title="Leave">
      <div className="space-y-4">
        <PageHeader
          title="Leave"
          description="Submit leave requests and follow their status."
          action={
            <LeaveRequestDialog
              remaining={balance?.remaining_leave ?? null}
              trigger={
                <Button>
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Request Leave
                </Button>
              }
            />
          }
        />

        <StatGrid columns={3}>
          <StatCard label="Total Leave" value={balance ? `${balance.total_leave} days` : '-'} hint={`Year ${today.year}`} />
          <StatCard
            label="Used"
            value={balance ? `${balance.used_leave} days` : '-'}
            hint="Approved requests only"
          />
          <StatCard
            label="Remaining"
            value={balance ? `${balance.remaining_leave} days` : '-'}
            hint="Available to request"
          />
        </StatGrid>

        <Card>
          <CardHeader title="Leave History" />
          {!records ? (
            <EmptyState title="Unable to load leave" description="Your leave history could not be loaded." />
          ) : (
            <DataTable
              columns={columns}
              rows={records.items}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No leave requests" description="Submit your first request using the button above." />}
            />
          )}
        </Card>

      </div>
    </EmployeeShell>
  )
}