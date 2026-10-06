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
import { SearchInput } from '@/components/ui/search-input'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmployeeIndexNav } from '@/components/ui/employee-index-nav'
import { initialsOf } from '@/lib/utils/initials'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/states'
import { NameCell } from '@/components/ui/avatar'
import { EmployeeActions } from '@/components/employees/employee-actions'
import { requireAdminSession } from '@/lib/supabase/session'
import { employeeQuerySchema } from '@/lib/validations/employee'
import { formatDate } from '@/lib/formatters'
import { listDepartments, listEmployees, type EmployeeRow } from '@/features/employees/queries'

export const metadata: Metadata = { title: 'Employees' }

type Search = Record<string, string | string[] | undefined>

const columns: Column<EmployeeRow>[] = [
  {
    key: 'employee',
    header: 'Employee',
    cell: (row) => (
      <NameCell
        name={row.full_name}
        meta={row.profiles?.email ?? row.employee_code}
        avatar={row.profiles?.avatar_url}
      />
    ),
  },
  { key: 'code', header: 'Employee ID', cell: (row) => <span className="tabular-nums">{row.employee_code}</span> },
  { key: 'department', header: 'Department', cell: (row) => row.departments?.name ?? '-' },
  { key: 'position', header: 'Position', cell: (row) => row.position ?? '-' },
  { key: 'type', header: 'Type', cell: (row) => <StatusBadge value={row.employment_type ?? '-'} tone="neutral" /> },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
  { key: 'join', header: 'Join Date', cell: (row) => formatDate(row.join_date) },
  {
    key: 'actions',
    header: 'Action',
    align: 'right',
    cell: (row) => <EmployeeActions employeeId={row.id} status={row.status} />,
  },
]

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const session = await requireAdminSession()
  const params = await searchParams
  const query = employeeQuerySchema.parse(params)
  const departments = await listDepartments(session.supabase)
  // One light query so the index can grey out letters nobody starts with.
  const { data: nameRows } = await session.supabase.from('employees').select('full_name')

  let employees: Awaited<ReturnType<typeof listEmployees>> | null = null
  let loadError = false

  try {
    employees = await listEmployees(session.supabase, query)
  } catch {
    loadError = true
  }

  return (
    <AdminShell title="Employees">
      <div className="space-y-4">
        <PageHeader
          title="Employees"
          description="Manage employee records and employment information."
          action={
            <Link href="/admin/employees/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden />
                Add Employee
              </Button>
            </Link>
          }
        />

        <Card>
          <CardBody className="space-y-3">
            <EmployeeIndexNav available={initialsOf((nameRows ?? []).map((row) => row.full_name))} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <SearchInput placeholder="Search name, employee ID, position..." className="w-full max-w-sm" />
              <FilterBar
                options={{
                  department_id: [
                    { value: '', label: 'All departments' },
                    ...departments.map((department) => ({ value: department.id, label: department.name })),
                  ],
                  employment_type: [
                    { value: '', label: 'All types' },
                    { value: 'permanent', label: 'Permanent' },
                    { value: 'contract', label: 'Contract' },
                  ],
                  status: [
                    { value: '', label: 'All statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ],
                }}
              />
            </div>
          </CardBody>

          {loadError ? (
            <ErrorState title="Unable to load employees" description="Employee data could not be loaded." />
          ) : !employees ? (
            <TableSkeleton rows={8} columns={7} />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={employees.items}
                rowKey={(row) => row.id}
                sort={{ column: query.sort, order: query.order }}
                empty={
                  <EmptyState
                    title={
                      query.search || query.department_id || query.status || query.employment_type
                        ? 'No results found for the selected filters.'
                        : 'No employees yet'
                    }
                    description={
                      query.search || query.department_id || query.status || query.employment_type
                        ? undefined
                        : 'Add your first employee to start managing your workforce.'
                    }
                    action={
                      <Link href="/admin/employees/new">
                        <Button size="sm">
                          <Plus className="h-4 w-4" aria-hidden />
                          Add Employee
                        </Button>
                      </Link>
                    }
                  />
                }
              />
              <Pagination
                page={query.page}
                limit={query.limit}
                total={employees.pagination.total}
                label="employees"
                buildHref={(page) => {
                  const next = new URLSearchParams()
                  for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string' && value && key !== 'page') next.set(key, value)
                  }
                  next.set('page', String(page))
                  return `/admin/employees?${next.toString()}`
                }}
              />
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  )
}
