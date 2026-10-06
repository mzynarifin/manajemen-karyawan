import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { AppError } from '@/lib/api-response'
import { AdminShell } from '@/components/layout/shell'
import { Card, CardBody, CardHeader, DescriptionRow } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/states'
import { ProfileAvatar } from '@/components/ui/avatar'
import { EmployeeEditForm } from '@/components/employees/employee-edit-form'
import { requireAdminSession } from '@/lib/supabase/session'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatTime,
  labelOf,
  pluralDays,
} from '@/lib/formatters'
import { getEmployee, listDepartments } from '@/features/employees/queries'
import { getLeaveBalance } from '@/features/leave/queries'
import { ATTENDANCE_START_TIME } from '@/lib/config'
import { toClock } from '@/lib/utils/clock'

export const metadata: Metadata = { title: 'Employee Detail' }

/** "09:00 - 18:00 (60 min break)", or the fallback when no shift is set. */
function formatShift(employee: { work_start: string | null; work_end: string | null; break_minutes: number }) {
  const start = toClock(employee.work_start)
  const end = toClock(employee.work_end)
  if (!start || !end) return `${ATTENDANCE_START_TIME} (company default)`
  const brk = employee.break_minutes ? ` (${employee.break_minutes} min break)` : ''
  return `${start} - ${end}${brk}`
}

type Search = Record<string, string | string[] | undefined>

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Search>
}) {
  const { id } = await params
  const query = await searchParams
  const session = await requireAdminSession()

  let employee
  try {
    employee = await getEmployee(session.supabase, id)
  } catch (error) {
    if (error instanceof AppError && error.code === 'EMPLOYEE_NOT_FOUND') notFound()
    throw error
  }

  const tab = typeof query.tab === 'string' ? query.tab : 'overview'
  const editing = query.edit === '1'
  const year = new Date().getFullYear()
  const departments = await listDepartments(session.supabase)

  const [balance, attendance, leave, payroll] = await Promise.all([
    getLeaveBalance(session.supabase, employee.id, year).catch(() => null),
    tab === 'attendance'
      ? session.supabase
          .from('attendance')
          .select('id, attendance_date, check_in, check_out, working_minutes, status')
          .eq('employee_id', employee.id)
          .order('attendance_date', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] as never[] }),
    tab === 'leave'
      ? session.supabase
          .from('leave_requests')
          .select('id, leave_type, start_date, end_date, total_days, status, created_at')
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] as never[] }),
    tab === 'payroll'
      ? session.supabase
          .from('payrolls')
          .select('id, period_month, period_year, net_salary, status, published_at')
          .eq('employee_id', employee.id)
          .order('period_year', { ascending: false })
          .order('period_month', { ascending: false })
          .limit(24)
      : Promise.resolve({ data: [] as never[] }),
  ])

  const tabs = [
    { value: 'overview', label: 'Overview', href: `/admin/employees/${employee.id}` },
    { value: 'attendance', label: 'Attendance', href: `/admin/employees/${employee.id}?tab=attendance` },
    { value: 'leave', label: 'Leave', href: `/admin/employees/${employee.id}?tab=leave` },
    { value: 'payroll', label: 'Payroll', href: `/admin/employees/${employee.id}?tab=payroll` },
  ]

  return (
    <AdminShell title={employee.full_name}>
      <div className="space-y-4">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to Employees
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ProfileAvatar name={employee.full_name} src={employee.profiles?.avatar_url} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-ink">{employee.full_name}</h1>
                <StatusBadge value={employee.status} />
              </div>
              <p className="mt-0.5 text-[13px] text-muted">
                {employee.employee_code} · {employee.position ?? 'Position not set'} ·{' '}
                {employee.departments?.name ?? 'No department'}
              </p>
            </div>
          </div>

          <Link href={`/admin/employees/${employee.id}?edit=1`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit Employee
            </Button>
          </Link>
        </div>

        <Tabs items={tabs} active={tab} />

        {editing ? (
          <EmployeeEditForm employee={employee} departments={departments} />
        ) : (
          <>
            {tab === 'overview' && (
              <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Personal Information" />
              <CardBody>
                <dl>
                  <DescriptionRow label="Email">{employee.profiles?.email ?? '-'}</DescriptionRow>
                  <DescriptionRow label="Phone">{employee.phone ?? '-'}</DescriptionRow>
                  <DescriptionRow label="Gender">{labelOf(employee.gender)}</DescriptionRow>
                  <DescriptionRow label="Birth Date">{formatDate(employee.birth_date)}</DescriptionRow>
                  <DescriptionRow label="Address">{employee.address ?? '-'}</DescriptionRow>
                </dl>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Employment Information" />
              <CardBody>
                <dl>
                  <DescriptionRow label="Department">{employee.departments?.name ?? '-'}</DescriptionRow>
                  <DescriptionRow label="Position">{employee.position ?? '-'}</DescriptionRow>
                  <DescriptionRow label="Join Date">{formatDate(employee.join_date)}</DescriptionRow>
                  <DescriptionRow label="Employment Type">
                    <StatusBadge value={employee.employment_type ?? '-'} tone="neutral" />
                  </DescriptionRow>
                  <DescriptionRow label="Base Salary">{formatCurrency(employee.base_salary)}</DescriptionRow>
                  <DescriptionRow label="Working Hours">{formatShift(employee)}</DescriptionRow>
                </dl>
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Summary" description={`Leave balance for ${year}`} />
              <CardBody className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[13px] text-muted">Remaining Leave</p>
                  <p className="mt-1 text-xl font-semibold text-ink tabular-nums">
                    {balance ? `${balance.remaining_leave} days` : 'No balance'}
                  </p>
                  {balance && (
                    <p className="mt-0.5 text-xs text-muted">
                      {balance.used_leave} of {balance.total_leave} used
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[13px] text-muted">Employment</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {Math.max(0, year - (employee.join_date ? Number(employee.join_date.slice(0, 4)) : year))} yrs
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Joined {formatDate(employee.join_date)}</p>
                </div>
                <div>
                  <p className="text-[13px] text-muted">Account</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {employee.profiles?.email ? 'Active' : 'Unlinked'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Updated {formatDate(employee.updated_at)}</p>
                </div>
              </CardBody>
            </Card>
              </div>
            )}

            {tab === 'attendance' && (
          <Card>
            <CardHeader title="Attendance" description="Last 30 records" />
            <DataTable
              columns={[
                { key: 'date', header: 'Date', cell: (row) => formatDate(row.attendance_date) },
                { key: 'in', header: 'Check In', cell: (row) => formatTime(row.check_in) },
                { key: 'out', header: 'Check Out', cell: (row) => formatTime(row.check_out) },
                { key: 'hours', header: 'Working Hours', align: 'right', cell: (row) => formatDuration(row.working_minutes) },
                { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
              ]}
              rows={attendance.data ?? []}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No attendance recorded" description="Attendance records will appear here." />}
            />
          </Card>
        )}

            {tab === 'leave' && (
          <Card>
            <CardHeader title="Leave Requests" description="Last 30 requests" />
            <DataTable
              columns={[
                { key: 'type', header: 'Type', cell: (row) => labelOf(row.leave_type) },
                {
                  key: 'range',
                  header: 'Date',
                  cell: (row) => `${formatDate(row.start_date)} - ${formatDate(row.end_date)}`,
                },
                { key: 'days', header: 'Duration', align: 'right', cell: (row) => pluralDays(row.total_days) },
                { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
                { key: 'submitted', header: 'Submitted', cell: (row) => formatDateTime(row.created_at) },
              ]}
              rows={leave.data ?? []}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No leave requests" description="Submitted requests will appear here." />}
            />
          </Card>
        )}

            {tab === 'payroll' && (
          <Card>
            <CardHeader title="Payroll" description="Last 24 periods" />
            <DataTable
              columns={[
                {
                  key: 'period',
                  header: 'Period',
                  cell: (row) => `${String(row.period_month).padStart(2, '0')}/${row.period_year}`,
                },
                { key: 'net', header: 'Net Salary', align: 'right', cell: (row) => formatCurrency(row.net_salary) },
                { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
                { key: 'published', header: 'Published', cell: (row) => formatDate(row.published_at) },
              ]}
              rows={payroll.data ?? []}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No payroll yet" description="Payroll records will appear here." />}
            />
          </Card>
        )}
          </>
        )}
      </div>
    </AdminShell>
  )
}