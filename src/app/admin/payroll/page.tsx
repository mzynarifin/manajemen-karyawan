import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmployeeIndexNav } from '@/components/ui/employee-index-nav'
import { initialsOf } from '@/lib/utils/initials'
import { EmptyState, ErrorState } from '@/components/ui/states'
import { PayrollRowActions } from '@/components/payroll/payroll-actions'
import { requireAdminSession } from '@/lib/supabase/session'
import { payrollQuerySchema } from '@/lib/validations/payroll'
import { formatCurrency, formatPeriod } from '@/lib/formatters'
import { listPayrolls, type PayrollRow } from '@/features/payroll/queries'
import { listDepartments } from '@/features/employees/queries'

export const metadata: Metadata = { title: 'Payroll' }

type Search = Record<string, string | string[] | undefined>

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(Date.UTC(2024, index, 1))),
}))

const YEARS = [2026, 2025, 2024].map((year) => ({ value: String(year), label: String(year) }))

const columns: Column<PayrollRow>[] = [
  { key: 'employee', header: 'Employee', cell: (row) => row.employees.full_name },
  {
    key: 'period',
    header: 'Period',
    cell: (row) => formatPeriod(row.period_month, row.period_year),
  },
  { key: 'base', header: 'Base', align: 'right', cell: (row) => formatCurrency(row.base_salary) },
  { key: 'allowance', header: 'Allowance', align: 'right', cell: (row) => formatCurrency(row.allowance) },
  { key: 'bonus', header: 'Bonus', align: 'right', cell: (row) => formatCurrency(row.bonus) },
  { key: 'deduction', header: 'Deduction', align: 'right', cell: (row) => formatCurrency(row.deduction) },
  {
    key: 'net',
    header: 'Net Salary',
    align: 'right',
    cell: (row) => <span className="font-semibold">{formatCurrency(row.net_salary)}</span>,
  },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
  { key: 'action', header: 'Action', align: 'right', cell: (row) => <PayrollRowActions payroll={row} /> },
]

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const session = await requireAdminSession()
  const params = await searchParams
  const query = payrollQuerySchema.parse(params)
  const departments = await listDepartments(session.supabase)
  // One light query so the index can grey out letters nobody starts with.
  const { data: nameRows } = await session.supabase.from('employees').select('full_name')

  let records: Awaited<ReturnType<typeof listPayrolls>> | null = null
  try {
    records = await listPayrolls(session.supabase, query, {})
  } catch {
    records = null
  }

  const hasFilters = Boolean(
    query.period_month || query.period_year || query.status || query.department_id || query.initial,
  )

  const initials = initialsOf((nameRows ?? []).map((row) => row.full_name))

  return (
    <AdminShell title="Payroll">
      <div className="space-y-4">
        <PageHeader
          title="Payroll"
          description="Manage employee payroll and published payslips."
          action={
            <Link href="/admin/payroll/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden />
                Create Payroll
              </Button>
            </Link>
          }
        />

        <Card>
          <CardBody className="space-y-3">
            <EmployeeIndexNav available={initials} />

            <FilterBar
              options={{
                period_month: [{ value: '', label: 'All months' }, ...MONTHS],
                period_year: [{ value: '', label: 'All years' }, ...YEARS],
                status: [
                  { value: '', label: 'All statuses' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                ],
                department_id: [
                  { value: '', label: 'All departments' },
                  ...departments.map((department) => ({ value: department.id, label: department.name })),
                ],
              }}
            />
          </CardBody>

          {!records ? (
            <ErrorState title="Unable to load payroll" description="Payroll data could not be loaded." />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={records.items}
                rowKey={(row) => row.id}
                empty={
                  <EmptyState
                    title={hasFilters ? 'No results found for the selected filters.' : 'No payroll records yet'}
                    description={hasFilters ? undefined : 'Create a payroll record to start the monthly cycle.'}
                    action={
                      hasFilters ? undefined : (
                        <Link href="/admin/payroll/new">
                          <Button size="sm">
                            <Plus className="h-4 w-4" aria-hidden />
                            Create Payroll
                          </Button>
                        </Link>
                      )
                    }
                  />
                }
              />
              <Pagination
                page={query.page}
                limit={query.limit}
                total={records.pagination.total}
                label="payroll records"
                buildHref={(page) => {
                  const next = new URLSearchParams()
                  for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string' && value && key !== 'page') next.set(key, value)
                  }
                  next.set('page', String(page))
                  return `/admin/payroll?${next.toString()}`
                }}
              />
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  )
}


