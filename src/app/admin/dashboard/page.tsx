import type { Metadata } from 'next'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader, StatCard, StatGrid } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/states'
import { AttendanceChart, DepartmentChart } from '@/components/dashboard/charts'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { requireAdminSession } from '@/lib/supabase/session'
import { nowInAppTimezone } from '@/lib/utils/date'
import { formatCurrencyShort } from '@/lib/formatters'
import {
  countAttendanceToday,
  countOnLeaveToday,
  departmentDistribution,
  employeeStatusCounts,
  listRecentActivity,
  sumPayrollPeriod,
} from '@/features/dashboard/queries'
import { countByStatus } from '@/features/leave/queries'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const session = await requireAdminSession()
  const today = nowInAppTimezone()
  const now = new Date()

  let data
  try {
    const [employees, present, late, onLeave, leaveCounts, payroll, activity, departments] = await Promise.all([
      employeeStatusCounts(session.supabase),
      countAttendanceToday(session.supabase, today.date, 'present'),
      countAttendanceToday(session.supabase, today.date, 'late'),
      countOnLeaveToday(session.supabase, today.date),
      countByStatus(session.supabase),
      sumPayrollPeriod(session.supabase, now.getMonth() + 1, now.getFullYear()),
      listRecentActivity(session.supabase),
      departmentDistribution(session.supabase),
    ])

    data = { employees, present, late, onLeave, leaveCounts, payroll, activity, departments }
  } catch {
    return (
      <AdminShell title="Dashboard">
        <PageHeader title="Dashboard" description="Overview of your workforce and HR operations." />
        <Card>
          <ErrorState description="The dashboard data could not be loaded." />
        </Card>
      </AdminShell>
    )
  }

  return (
    <AdminShell title="Dashboard">
      <div className="space-y-5">
        <PageHeader title="Dashboard" description="Overview of your workforce and HR operations." />

        <StatGrid>
          <StatCard
            label="Total Employees"
            value={data.employees.active + data.employees.inactive}
            hint={`${data.employees.active} active · ${data.employees.inactive} inactive`}
          />
          <StatCard label="Present Today" value={data.present} hint={`${data.late} late`} />
          <StatCard label="On Leave Today" value={data.onLeave} />
          <StatCard label="Pending Leave Requests" value={data.leaveCounts.pending} />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Attendance Today" description="Checked in so far today" />
            <CardBody>
              <AttendanceChart present={data.present} late={data.late} leave={data.onLeave} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Employee Distribution" description="Headcount per department" />
            <CardBody>
              <DepartmentChart items={data.departments} />
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Recent Activity" description="Latest HR operations" />
            <CardBody className="px-0 py-0">
              <ActivityFeed items={data.activity} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Payroll This Month" description="Published payslips" />
            <CardBody className="space-y-3">
              <p className="text-2xl font-semibold tracking-tight text-ink">
                {formatCurrencyShort(data.payroll.total)}
              </p>
              <p className="text-[13px] text-muted">
                {data.payroll.count} published payslip{data.payroll.count === 1 ? '' : 's'} for{' '}
                {now.toLocaleString('en-GB', { month: 'long' })} {now.getFullYear()}.
              </p>
              <a
                href="/admin/payroll"
                className="inline-block text-[13px] font-medium text-brand-700 hover:text-brand-800"
              >
                Manage payroll
              </a>
            </CardBody>
          </Card>
        </div>
      </div>
    </AdminShell>
  )
}