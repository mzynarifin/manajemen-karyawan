import type { Metadata } from 'next'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmployeeIndexNav } from '@/components/ui/employee-index-nav'
import { initialsOf } from '@/lib/utils/initials'
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states'
import { requireAdminSession } from '@/lib/supabase/session'
import { attendanceQuerySchema } from '@/lib/validations/attendance'
import { formatDate, formatDuration, formatTime } from '@/lib/formatters'
import { listAttendance, type AttendanceRow } from '@/features/attendance/queries'
import { listDepartments, listActiveEmployees } from '@/features/employees/queries'

export const metadata: Metadata = { title: 'Attendance' }

type Search = Record<string, string | string[] | undefined>

const columns: Column<AttendanceRow>[] = [
  { key: 'employee', header: 'Employee', cell: (row) => row.employees.full_name },
  { key: 'date', header: 'Date', cell: (row) => formatDate(row.attendance_date) },
  { key: 'in', header: 'Check In', cell: (row) => formatTime(row.check_in) },
  { key: 'out', header: 'Check Out', cell: (row) => formatTime(row.check_out) },
  {
    key: 'hours',
    header: 'Working Hours',
    align: 'right',
    cell: (row) => formatDuration(row.working_minutes),
  },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
]

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const session = await requireAdminSession()
  const params = await searchParams
  const query = attendanceQuerySchema.parse(params)
  const [departments, employees] = await Promise.all([
    listDepartments(session.supabase),
    listActiveEmployees(session.supabase),
  ])

  let records: Awaited<ReturnType<typeof listAttendance>> | null = null
  let loadError = false

  try {
    records = await listAttendance(session.supabase, query, {})
  } catch {
    loadError = true
  }

  const hasFilters = Boolean(
    query.date_from || query.date_to || query.status || query.department_id || query.employee_id || query.initial,
  )

  return (
    <AdminShell title="Attendance">
      <div className="space-y-4">
        <PageHeader title="Attendance" description="Monitor employee attendance records." />

        <Card>
          <CardBody className="space-y-3">
            <EmployeeIndexNav available={initialsOf(employees.map((employee) => employee.full_name))} />

            <FilterBar
              options={{
                status: [
                  { value: '', label: 'All statuses' },
                  { value: 'present', label: 'Present' },
                  { value: 'late', label: 'Late' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'leave', label: 'Leave' },
                ],
                department_id: [
                  { value: '', label: 'All departments' },
                  ...departments.map((department) => ({ value: department.id, label: department.name })),
                ],
                employee_id: [
                  { value: '', label: 'All employees' },
                  ...employees.map((employee) => ({ value: employee.id, label: employee.full_name })),
                ],
              }}
            />
            <DateRangeFilter />
          </CardBody>

          {loadError ? (
            <ErrorState title="Unable to load attendance" description="Attendance records could not be loaded." />
          ) : !records ? (
            <TableSkeleton rows={8} columns={6} />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={records.items}
                rowKey={(row) => row.id}
                sort={{ column: query.sort, order: query.order }}
                empty={
                  <EmptyState
                    title={
                      hasFilters
                        ? 'No results found for the selected filters.'
                        : 'No attendance recorded yet'
                    }
                    description={hasFilters ? undefined : 'Records appear once employees start checking in.'}
                  />
                }
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
                  return `/admin/attendance?${next.toString()}`
                }}
              />
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  )
}
