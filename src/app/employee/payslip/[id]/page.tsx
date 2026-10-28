import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Card, CardBody, CardHeader, DescriptionRow } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { PayslipSheet } from '@/components/payroll/payslip-sheet'
import { getSessionEmployee, requireEmployeeSession } from '@/lib/supabase/session'
import { formatCurrency, formatDate, formatDateLong, formatPeriod } from '@/lib/formatters'
import { payrollPeriodKey } from '@/lib/payroll'

export const metadata: Metadata = { title: 'Payslip' }

export default async function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireEmployeeSession()

  const employee = await getSessionEmployee(session)

  if (!employee) notFound()

  // RLS only exposes published payroll rows for the signed-in employee.
  const { data, error } = await session.supabase
    .from('payrolls')
    .select('*, employees!inner(id, employee_code, full_name, position, departments(id, name))')
    .eq('id', id)
    .eq('employee_id', employee.id)
    .maybeSingle()

  if (error || !data) notFound()

  const payroll = data as {
    id: string
    period_month: number
    period_year: number
    base_salary: number
    allowance: number
    bonus: number
    deduction: number
    net_salary: number
    status: string
    published_at: string | null
    employees: {
      employee_code: string
      full_name: string
      position: string | null
      departments: { id: string; name: string } | null
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/employee/payslip"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to Payslips
      </Link>

      <PayslipSheet
        sheet={{
          employee: {
            employee_code: payroll.employees.employee_code,
            full_name: payroll.employees.full_name,
            position: payroll.employees.position,
            department: payroll.employees.departments?.name ?? null,
          },
          payroll: {
            period: payrollPeriodKey(payroll.period_month, payroll.period_year),
            base_salary: payroll.base_salary,
            allowance: payroll.allowance,
            bonus: payroll.bonus,
            deduction: payroll.deduction,
            net_salary: payroll.net_salary,
            status: payroll.status,
            published_at: payroll.published_at,
          },
        }}
      />

      <Card>
        <CardHeader title="Details" />
        <CardBody>
          <dl>
            <DescriptionRow label="Period">{formatPeriod(payroll.period_month, payroll.period_year)}</DescriptionRow>
            <DescriptionRow label="Base Salary">{formatCurrency(payroll.base_salary)}</DescriptionRow>
            <DescriptionRow label="Allowance">{formatCurrency(payroll.allowance)}</DescriptionRow>
            <DescriptionRow label="Bonus">{formatCurrency(payroll.bonus)}</DescriptionRow>
            <DescriptionRow label="Deduction">{formatCurrency(payroll.deduction)}</DescriptionRow>
            <DescriptionRow label="Net Salary">
              <span className="text-base font-semibold">{formatCurrency(payroll.net_salary)}</span>
            </DescriptionRow>
            <DescriptionRow label="Published At">{formatDateLong(payroll.published_at)}</DescriptionRow>
            <DescriptionRow label="Status">
              <StatusBadge value={payroll.status} />
            </DescriptionRow>
          </dl>
          <p className="mt-3 text-xs text-muted">Published date recorded on {formatDate(payroll.published_at)}.</p>
        </CardBody>
      </Card>
    </div>
  )
}
