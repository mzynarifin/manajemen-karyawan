import type { Metadata } from 'next'
import { EmployeeShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { AttendanceActions } from '@/components/attendance/attendance-actions'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { attendanceQuerySchema } from '@/lib/validations/attendance'
import { nowInAppTimezone } from '@/lib/utils/date'
import { formatDate, formatDuration, formatTime } from '@/lib/formatters'
import { getAttendanceForDate, listAttendance, type AttendanceRow } from '@/features/attendance/queries'

export const metadata: Metadata = { title: 'My Attendance' }

type Search = Record<string, string | string[] | undefined>

const columns: Column<AttendanceRow>[] = [
  { key: 'date', header: 'Date', cell: (row) => formatDate(row.attendance_date) },
  { key: 'in', header: 'Check In', cell: (row) => formatTime(row.check_in) },
  { key: 'out', header: 'Check Out', cell: (row) => formatTime(row.check_out) },
  { key: 'hours', header: 'Working Hours', align: 'right', cell: (row) => formatDuration(row.working_minutes) },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
]

export default async function EmployeeAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const session = await requireEmployeeSession()
  const params = await searchParams
  const query = attendanceQuerySchema.parse(params)
  const today = nowInAppTimezone()

  const { data: employee } = await session.supabase
    .from('employees')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!employee) {
    return (
      <EmployeeShell title="Attendance">
        <Card>
          <EmptyState title="No employee record" description="Contact HR to link your account." />
        </Card>
      </EmployeeShell>
    )
  }

  const [attendanceToday, records] = await Promise.all([
    getAttendanceForDate(session.supabase, employee.id, today.date),
    listAttendance(session.supabase, query, { employeeId: employee.id }).catch(() => null),
  ])

  return (
    <EmployeeShell title="Attendance">
      <div className="space-y-4">
        <PageHeader title="Attendance" description="Your check-in history and working hours." />

        <Card>
          <CardHeader
            title="Today's Attendance"
            description={formatDate(today.date)}
            action={<AttendanceActions attendance={attendanceToday} />}
          />
          <CardBody>
            {attendanceToday ? (
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-[13px] text-muted">Check In</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink">
                    {formatTime(attendanceToday.check_in)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Check Out</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink">
                    {attendanceToday.check_out ? formatTime(attendanceToday.check_out) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Working Hours</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink">
                    {formatDuration(attendanceToday.working_minutes)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Status</dt>
                  <dd className="mt-0.5">
                    <StatusBadge value={attendanceToday.status} />
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="py-1 text-[13px] text-muted">No attendance record for today yet.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Attendance History" />
          <CardBody>
            <FilterBar
              options={{
                status: [
                  { value: '', label: 'All statuses' },
                  { value: 'present', label: 'Present' },
                  { value: 'late', label: 'Late' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'leave', label: 'Leave' },
                ],
              }}
            />
          </CardBody>

          {!records ? (
            <ErrorState title="Unable to load attendance" />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={records.items}
                rowKey={(row) => row.id}
                sort={{ column: query.sort, order: query.order }}
                empty={<EmptyState title="No records found" description="Attendance history will appear here." />}
              />
              <Pagination
                page={query.page}
                limit={query.limit}
                total={records.pagination.total}
                label="records"
                buildHref={(page) => {
                  const next = new URLSearchParams()
                  for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string' && value && key !== 'page') next.set(key, value)
                  }
                  next.set('page', String(page))
                  return `/employee/attendance?${next.toString()}`
                }}
              />
            </>
          )}
        </Card>
      </div>
    </EmployeeShell>
  )
}