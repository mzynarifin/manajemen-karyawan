import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarPlus, Clock, Receipt } from 'lucide-react'
import { EmployeeShell } from '@/components/layout/shell'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { StatCard, StatGrid } from '@/components/ui/page-header'
import { AttendanceActions } from '@/components/attendance/attendance-actions'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { nowInAppTimezone } from '@/lib/utils/date'
import { formatCurrency, formatDate, formatDuration, formatTime } from '@/lib/formatters'
import { getAttendanceForDate } from '@/features/attendance/queries'
import { getLeaveBalance } from '@/features/leave/queries'

export const metadata: Metadata = { title: 'My Dashboard' }

export default async function EmployeeDashboardPage() {
  const session = await requireEmployeeSession()
  const today = nowInAppTimezone()

  const { data: employeeRow } = await session.supabase
    .from('employees')
    .select('id, full_name, join_date')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!employeeRow) {
    return (
      <EmployeeShell title="Dashboard">
        <Card>
          <EmptyState
            title="No employee record"
            description="Your account is not linked to an employee record yet. Contact HR."
          />
        </Card>
      </EmployeeShell>
    )
  }

  const employee = employeeRow as { id: string; full_name: string; join_date: string | null }

  const [attendance, balance, latestPayroll, pendingLeave] = await Promise.all([
    getAttendanceForDate(session.supabase, employee.id, today.date),
    getLeaveBalance(session.supabase, employee.id, today.year),
    session.supabase
      .from('payrolls')
      .select('id, net_salary, period_month, period_year')
      .eq('employee_id', employee.id)
      .eq('status', 'published')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(1),
    session.supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employee.id)
      .eq('status', 'pending'),
  ])

  const payslip = latestPayroll.data?.[0] as
    | { id: string; net_salary: number; period_month: number; period_year: number }
    | undefined

  const firstName = (session.profile.full_name || employee.full_name || 'there').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Good morning' : hour < 15 ? 'Good afternoon' : 'Good evening'

  return (
    <EmployeeShell title="Dashboard">
      <div className="space-y-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Here is your work summary for today, {formatDate(today.date)}.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Attendance Today"
              description={formatDate(today.date)}
              action={<AttendanceActions attendance={attendance} />}
            />
            <CardBody>
              {attendance ? (
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-[13px] text-muted">Check In</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink">
                      {formatTime(attendance.check_in)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted">Check Out</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink">
                      {attendance.check_out ? formatTime(attendance.check_out) : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted">Working Hours</dt>
                    <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink">
                      {formatDuration(attendance.working_minutes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted">Status</dt>
                    <dd className="mt-0.5">
                      <StatusBadge value={attendance.status} />
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <Clock className="h-4 w-4 text-muted" aria-hidden />
                  <p className="text-[13px] text-muted">You have not checked in yet today.</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody className="space-y-2">
              <Link href="/employee/leave" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Request Leave
                </Button>
              </Link>
              <Link href="/employee/attendance" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <Clock className="h-4 w-4" aria-hidden />
                  View Attendance
                </Button>
              </Link>
              <Link href="/employee/payslip" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <Receipt className="h-4 w-4" aria-hidden />
                  View Payslip
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>

        <StatGrid>
          <StatCard
            label="Leave Balance"
            value={balance ? `${balance.remaining_leave} days` : '-'}
            hint={balance ? `${balance.used_leave} of ${balance.total_leave} used` : 'No balance record'}
          />
          <StatCard label="Pending Leave" value={pendingLeave.count ?? 0} hint="Awaiting HR review" />
          <StatCard
            label="Latest Payslip"
            value={payslip ? formatCurrency(payslip.net_salary) : '-'}
            hint={
              payslip
                ? `${String(payslip.period_month).padStart(2, '0')}/${payslip.period_year}`
                : 'No published payroll'
            }
          />
          <StatCard label="Joined" value={formatDate(employee.join_date)} hint="Employment start date" />
        </StatGrid>
      </div>
    </EmployeeShell>
  )
}