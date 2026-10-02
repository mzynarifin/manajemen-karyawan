import type { Metadata } from 'next'
import { EmployeeShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { payrollQuerySchema } from '@/lib/validations/payroll'
import { formatCurrency, formatDate, formatPeriod } from '@/lib/formatters'
import { listPayrolls, type PayrollRow } from '@/features/payroll/queries'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Payslips' }

type Search = Record<string, string | string[] | undefined>

const columns: Column<PayrollRow>[] = [
  { key: 'period', header: 'Period', cell: (row) => formatPeriod(row.period_month, row.period_year) },
  {
    key: 'net',
    header: 'Net Salary',
    align: 'right',
    cell: (row) => <span className="font-semibold">{formatCurrency(row.net_salary)}</span>,
  },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
  { key: 'published', header: 'Published Date', cell: (row) => formatDate(row.published_at) },
  {
    key: 'action',
    header: 'Action',
    align: 'right',
    cell: (row) => (
      <Link
        href={`/employee/payslip/${row.id}`}
        className="text-[13px] font-medium text-brand-700 hover:text-brand-800"
      >
        View Payslip
      </Link>
    ),
  },
]

export default async function PayslipListPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await requireEmployeeSession()
  const params = await searchParams
  const query = payrollQuerySchema.parse(params)

  const { data: employee } = await session.supabase
    .from('employees')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!employee) {
    return (
      <EmployeeShell title="Payslips">
        <Card>
          <EmptyState title="No employee record" description="Contact HR to link your account." />
        </Card>
      </EmployeeShell>
    )
  }

  const records = await listPayrolls(session.supabase, { ...query, limit: 20 }, { employeeId: employee.id }).catch(
    () => null,
  )

  return (
    <EmployeeShell title="Payslips">
      <div className="space-y-4">
        <PageHeader title="Payslips" description="Published payslips from your payroll records." />

        <Card>
          <CardBody>
            <p className="text-[13px] text-muted">
              Draft payroll is not visible here. You will get a notification as soon as a period is published.
            </p>
          </CardBody>

          {!records ? (
            <ErrorState title="Unable to load payslips" />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={records.items}
                rowKey={(row) => row.id}
                empty={
                  <EmptyState
                    title="No payslips yet"
                    description="Published payslips will appear here."
                  />
                }
              />
              <Pagination
                page={query.page}
                limit={20}
                total={records.pagination.total}
                label="payslips"
                buildHref={(page) => {
                  const next = new URLSearchParams()
                  for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string' && value && key !== 'page') next.set(key, value)
                  }
                  next.set('page', String(page))
                  return `/employee/payslip?${next.toString()}`
                }}
              />
            </>
          )}
        </Card>
      </div>
    </EmployeeShell>
  )
}
