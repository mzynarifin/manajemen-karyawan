import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader, StatCard, StatGrid } from '@/components/ui/page-header'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/states'
import { AttendanceChart, DepartmentChart } from '@/components/dashboard/charts'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { requireAdminSession } from '@/lib/supabase/session'
import { APP_TIMEZONE } from '@/lib/config'
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

  let data
  try {
    const [employees, present, late, onLeave, leaveCounts, payroll, activity, departments] = await Promise.all([
      employeeStatusCounts(session.supabase),
      countAttendanceToday(session.supabase, today.date, 'present'),
      countAttendanceToday(session.supabase, today.date, 'late'),
      countOnLeaveToday(session.supabase, today.date),
      countByStatus(session.supabase),
      sumPayrollPeriod(session.supabase, today.month, today.year),
      listRecentActivity(session.supabase, 12),
      departmentDistribution(session.supabase),
    ])

    // Anyone active who has neither checked in nor taken leave today.
    const notCheckedIn = Math.max(0, employees.active - present - late - onLeave)

    data = { employees, present, late, onLeave, notCheckedIn, leaveCounts, payroll, activity, departments }
  } catch (error) {
    console.error('[dashboard] admin dashboard failed', error)
    return (
      <AdminShell title="Dashboard">
        <PageHeader title="Dashboard" description="Overview of your workforce and HR operations." />
        <Card>
          <ErrorState description="The dashboard data could not be loaded." />
        </Card>
      </AdminShell>
    )
  }

  const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: APP_TIMEZONE }).format(new Date())
  const payrollProgress = data.employees.active
    ? Math.min(100, Math.round((data.payroll.count / data.employees.active) * 100))
    : 0

  return (
    <AdminShell title="Dashboard">
      <div className="space-y-5">
        <PageHeader
          title="Dashboard"
          description={`${today.date} · ${monthLabel} ${today.year}`}
          action={
            <div className="flex items-center gap-2">
              <Link href="/admin/payroll/new">
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4" aria-hidden />
                  Create Payroll
                </Button>
              </Link>
              <Link href="/admin/employees/new">
                <Button size="sm">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Add Employee
                </Button>
              </Link>
            </div>
          }
        />

        <StatGrid>
          <StatCard
            label="Total Employees"
            value={data.employees.active + data.employees.inactive}
            hint={`${data.employees.active} active · ${data.employees.inactive} inactive`}
            href="/admin/employees"
          />
          <StatCard
            label="Present Today"
            value={data.present + data.late}
            hint={`${data.present} on time · ${data.late} late · ${data.notCheckedIn} not checked in`}
            href="/admin/attendance"
          />
          <StatCard
            label="On Leave Today"
            value={data.onLeave}
            hint="Approved requests covering today"
            href="/admin/leave"
          />
          <StatCard
            label="Pending Leave Requests"
            value={data.leaveCounts.pending}
            hint="Awaiting your review"
            href="/admin/leave"
          />
        </StatGrid>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader title="Attendance Today" description={`${monthLabel} ${today.year}`} />
            <CardBody className="flex-1">
              <AttendanceChart
                present={data.present}
                late={data.late}
                leave={data.onLeave}
                absent={data.notCheckedIn}
              />
            </CardBody>
          </Card>

          <Card className="flex flex-col">
            <CardHeader title="Employee Distribution" description="Headcount per department" />
            <CardBody className="flex-1">
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

          <Card className="flex flex-col">
            <CardHeader title="Payroll This Month" description={`${monthLabel} ${today.year}`} />
            <CardBody className="flex flex-1 flex-col space-y-4">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-ink tabular-nums">
                  {formatCurrencyShort(data.payroll.total)}
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {data.payroll.count} of {data.employees.active} employees paid
                  {data.payroll.draft > 0 && ` · ${data.payroll.draft} still draft`}
                </p>
              </div>

              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-canvas"
                role="img"
                aria-label={`${payrollProgress}% of employees paid`}
              >
                <div className="h-full rounded-full bg-brand-700" style={{ width: `${payrollProgress}%` }} />
              </div>

              <Link
                href="/admin/payroll"
                className="inline-block text-[13px] font-medium text-brand-700 hover:text-brand-800"
              >
                Manage payroll
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </AdminShell>
  )
}