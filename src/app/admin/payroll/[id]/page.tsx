import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AppError } from '@/lib/api-response'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, DescriptionRow } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { PayslipSheet } from '@/components/payroll/payslip-sheet'
import { PayrollEditForm } from '@/components/payroll/payroll-edit-form'
import { PublishPayrollButton } from '@/components/payroll/payroll-actions'
import { requireAdminSession } from '@/lib/supabase/session'
import { formatDate, formatPeriod } from '@/lib/formatters'
import { getPayroll } from '@/features/payroll/queries'

export const metadata: Metadata = { title: 'Payroll Detail' }

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAdminSession()

  let payroll
  try {
    payroll = await getPayroll(session.supabase, id)
  } catch (error) {
    if (error instanceof AppError && error.code === 'PAYROLL_NOT_FOUND') notFound()
    throw error
  }

  const isDraft = payroll.status === 'draft'

  return (
    <AdminShell title="Payroll Detail">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/admin/payroll"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to Payroll
        </Link>

        <PageHeader
          title={payroll.employees.full_name}
          description={`${formatPeriod(payroll.period_month, payroll.period_year)} · ${payroll.employees.employee_code}`}
          action={isDraft ? <PublishPayrollButton payrollId={payroll.id} /> : undefined}
        />

        <Card>
          <CardBody>
            <dl>
              <DescriptionRow label="Period">{formatPeriod(payroll.period_month, payroll.period_year)}</DescriptionRow>
              <DescriptionRow label="Department">{payroll.employees.departments?.name ?? '-'}</DescriptionRow>
              <DescriptionRow label="Position">{payroll.employees.position ?? '-'}</DescriptionRow>
              <DescriptionRow label="Status">
                <StatusBadge value={payroll.status} />
              </DescriptionRow>
              <DescriptionRow label="Published At">{formatDate(payroll.published_at)}</DescriptionRow>
            </dl>
          </CardBody>
        </Card>

        {isDraft ? (
          <PayrollEditForm payroll={payroll} />
        ) : (
          <PayslipSheet
            sheet={{
              employee: {
                employee_code: payroll.employees.employee_code,
                full_name: payroll.employees.full_name,
                position: payroll.employees.position,
                department: payroll.employees.departments?.name ?? null,
              },
              payroll: {
                period: `${payroll.period_year}-${String(payroll.period_month).padStart(2, '0')}`,
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
        )}
      </div>
    </AdminShell>
  )
}