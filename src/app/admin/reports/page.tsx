import type { Metadata } from 'next'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader, StatCard, StatGrid } from '@/components/ui/page-header'
import { Tabs } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/states'
import { DataTable } from '@/components/ui/table'
import { requireAdminSession } from '@/lib/supabase/session'
import { reportQuerySchema } from '@/lib/validations/report'
import { attendanceReport, employeeReport, leaveReport, payrollReport } from '@/services/report.service'
import { ReportFilterBar } from '@/components/reports/report-filter-bar'
import { formatCurrency } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Reports' }

type Search = Record<string, string | string[] | undefined>

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await requireAdminSession()
  // Deep links from the sidebar carry no ?type, so a bad or missing value falls
  // back to the first tab instead of throwing a ZodError at the page boundary.
  const query = reportQuerySchema.catch({ type: 'employee' }).parse(await searchParams)

  const tabs = [
    { value: 'employee', label: 'Employees', href: '/admin/reports?type=employee' },
    { value: 'attendance', label: 'Attendance', href: '/admin/reports?type=attendance' },
    { value: 'leave', label: 'Leave', href: '/admin/reports?type=leave' },
    { value: 'payroll', label: 'Payroll', href: '/admin/reports?type=payroll' },
  ]

  let content: React.ReactNode = null

  try {
    if (query.type === 'employee') {
      const report = await employeeReport(session.supabase, query)

      content = (
        <div className="space-y-4">
          <StatGrid columns={3}>
            <StatCard label="Total Employees" value={report.total} />
            <StatCard label="Active Employees" value={report.active} />
            <StatCard label="Inactive Employees" value={report.inactive} />
          </StatGrid>

          <Card>
            <DataTable
              columns={[
                { key: 'department', header: 'Department', cell: (row) => row.department_name },
                {
                  key: 'total',
                  header: 'Total Employees',
                  align: 'right',
                  cell: (row) => row.total_employee,
                },
              ]}
              rows={report.by_department}
              rowKey={(row) => row.department_id}
            />
          </Card>
        </div>
      )
    }

    if (query.type === 'attendance') {
      const report = await attendanceReport(session.supabase, query)
      content = (
        <StatGrid>
          <StatCard label="Present" value={report.present} />
          <StatCard label="Late" value={report.late} />
          <StatCard label="Absent" value={report.absent} />
          <StatCard label="Leave" value={report.leave} />
        </StatGrid>
      )
    }

    if (query.type === 'leave') {
      const report = await leaveReport(session.supabase, query)
      content = (
        <StatGrid>
          <StatCard label="Total Requests" value={report.total_request} />
          <StatCard label="Pending" value={report.pending} />
          <StatCard label="Approved" value={report.approved} />
          <StatCard label="Rejected" value={report.rejected} />
        </StatGrid>
      )
    }

    if (query.type === 'payroll') {
      const report = await payrollReport(session.supabase, query)
      content = (
        <StatGrid>
          <StatCard label="Total Payroll" value={report.total_payroll} hint="Published payslips" />
          <StatCard label="Average Payroll" value={formatCurrency(report.average_payroll)} />
          <StatCard label="Total Allowance" value={formatCurrency(report.total_allowance)} />
          <StatCard label="Total Deduction" value={formatCurrency(report.total_deduction)} />
        </StatGrid>
      )
    }
  } catch (error) {
    console.error('[reports] admin report failed', error)
    content = (
      <Card>
        <ErrorState title="Unable to build this report" description="The report data could not be loaded." />
      </Card>
    )
  }

  return (
    <AdminShell title="Reports">
      <div className="space-y-4">
        <PageHeader title="Reports" description="Summary of workforce, attendance, leave and payroll." />

        <Tabs items={tabs} active={query.type} />

        <ReportFilterBar type={query.type} current={query} basePath="/admin/reports" />

        {content}
      </div>
    </AdminShell>
  )
}
