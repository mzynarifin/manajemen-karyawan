import type { Metadata } from 'next'
import { EmployeeShell } from '@/components/layout/shell'
import { PageHeader, StatCard, StatGrid } from '@/components/ui/page-header'
import { Tabs } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { DataTable, type Column } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { ReportFilterBar } from '@/components/reports/report-filter-bar'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { myReportQuerySchema } from '@/lib/validations/report'
import { attendanceReport, leaveReport, payrollReport } from '@/services/report.service'
import { listAttendance, type AttendanceRow } from '@/features/attendance/queries'
import { listLeave, type LeaveRow } from '@/features/leave/queries'
import { listPayrolls, type PayrollRow } from '@/features/payroll/queries'
import { formatCurrency, formatDate, formatDuration, formatPeriod, formatTime } from '@/lib/formatters'

export const metadata: Metadata = { title: 'My Reports' }

type Search = Record<string, string | string[] | undefined>

const attendanceColumns: Column<AttendanceRow>[] = [
  { key: 'date', header: 'Date', cell: (row) => formatDate(row.attendance_date) },
  { key: 'in', header: 'Check In', cell: (row) => formatTime(row.check_in) },
  { key: 'out', header: 'Check Out', cell: (row) => formatTime(row.check_out) },
  { key: 'hours', header: 'Working Hours', align: 'right', cell: (row) => formatDuration(row.working_minutes) },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
]

const leaveColumns: Column<LeaveRow>[] = [
  { key: 'type', header: 'Type', cell: (row) => row.leave_type },
  { key: 'from', header: 'From', cell: (row) => formatDate(row.start_date) },
  { key: 'to', header: 'To', cell: (row) => formatDate(row.end_date) },
  { key: 'days', header: 'Days', align: 'right', cell: (row) => row.total_days },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
]

const payrollColumns: Column<PayrollRow>[] = [
  { key: 'period', header: 'Period', cell: (row) => formatPeriod(row.period_month, row.period_year) },
  { key: 'base', header: 'Base', align: 'right', cell: (row) => formatCurrency(row.base_salary) },
  { key: 'allowance', header: 'Allowance', align: 'right', cell: (row) => formatCurrency(row.allowance) },
  { key: 'bonus', header: 'Bonus', align: 'right', cell: (row) => formatCurrency(row.bonus) },
  { key: 'deduction', header: 'Deduction', align: 'right', cell: (row) => formatCurrency(row.deduction) },
  {
    key: 'net',
    header: 'Net',
    align: 'right',
    cell: (row) => <span className="font-semibold">{formatCurrency(row.net_salary)}</span>,
  },
]

const LIST_LIMIT = 10

export default async function MyReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await requireEmployeeSession()
  const query = myReportQuerySchema.catch({ type: 'attendance' }).parse(await searchParams)

  const { data: employee } = await session.supabase
    .from('employees')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!employee) {
    return (
      <EmployeeShell title="My Reports">
        <Card>
          <EmptyState title="No employee record" description="Contact HR to link your account." />
        </Card>
      </EmployeeShell>
    )
  }

  const employeeId = employee.id as string

  const tabs = [
    { value: 'attendance', label: 'Attendance', href: '/employee/reports?type=attendance' },
    { value: 'leave', label: 'Leave', href: '/employee/reports?type=leave' },
    { value: 'payroll', label: 'Payroll', href: '/employee/reports?type=payroll' },
  ]

  let content: React.ReactNode = null

  try {
    if (query.type === 'attendance') {
      const [summary, detail] = await Promise.all([
        attendanceReport(session.supabase, { ...query, employee_id: employeeId }),
        listAttendance(
          session.supabase,
          { ...query, page: 1, limit: LIST_LIMIT, sort: 'attendance_date', order: 'desc' },
          { employeeId },
        ),
      ])

      content = (
        <div className="space-y-4">
          <StatGrid>
            <StatCard label="Present" value={summary.present} />
            <StatCard label="Late" value={summary.late} />
            <StatCard label="Absent" value={summary.absent} />
            <StatCard label="Leave" value={summary.leave} />
          </StatGrid>

          <Card>
            <DataTable
              columns={attendanceColumns}
              rows={detail.items}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No attendance records" description="Records in this range will appear here." />}
            />
          </Card>
        </div>
      )
    }

    if (query.type === 'leave') {
      const [summary, detail] = await Promise.all([
        leaveReport(session.supabase, { ...query, employee_id: employeeId }),
        listLeave(
          session.supabase,
          { ...query, page: 1, limit: LIST_LIMIT, sort: 'start_date', order: 'desc' },
          { employeeId },
        ),
      ])

      content = (
        <div className="space-y-4">
          <StatGrid columns={3}>
            <StatCard label="Pending" value={summary.pending} hint="Awaiting HR review" />
            <StatCard label="Approved" value={summary.approved} />
            <StatCard label="Rejected" value={summary.rejected} />
          </StatGrid>

          <Card>
            <DataTable
              columns={leaveColumns}
              rows={detail.items}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No leave requests" description="Requests in this range will appear here." />}
            />
          </Card>
        </div>
      )
    }

    if (query.type === 'payroll') {
      const [summary, detail] = await Promise.all([
        payrollReport(session.supabase, { ...query, employee_id: employeeId }),
        listPayrolls(
          session.supabase,
          { ...query, page: 1, limit: LIST_LIMIT, sort: 'created_at', order: 'desc' },
          { employeeId },
        ),
      ])

      content = (
        <div className="space-y-4">
          <StatGrid>
            <StatCard label="Total Net Salary" value={formatCurrency(summary.total_net_salary)} hint="Published payslips" />
            <StatCard label="Average Payslip" value={formatCurrency(summary.average_payroll)} />
            <StatCard label="Total Allowance" value={formatCurrency(summary.total_allowance)} />
            <StatCard label="Total Deduction" value={formatCurrency(summary.total_deduction)} />
          </StatGrid>

          <Card>
            <DataTable
              columns={payrollColumns}
              rows={detail.items}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No published payslips" description="Payslips appear here once HR publishes a period." />}
            />
          </Card>
        </div>
      )
    }
  } catch (error) {
    console.error('[reports] my report failed', error)
    content = (
      <Card>
        <ErrorState title="Unable to build this report" description="The report data could not be loaded." />
      </Card>
    )
  }

  return (
    <EmployeeShell title="My Reports">
      <div className="space-y-4">
        <PageHeader title="My Reports" description="Your own attendance, leave and payroll history." />

        <Tabs items={tabs} active={query.type} />

        <ReportFilterBar type={query.type} current={query} basePath="/employee/reports" />

        {content}
      </div>
    </EmployeeShell>
  )
}
