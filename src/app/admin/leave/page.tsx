import type { Metadata } from 'next'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader, StatCard, StatGrid } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { FilterBar } from '@/components/ui/filter-bar'
import { ErrorState } from '@/components/ui/states'
import { LeaveTable } from '@/components/leave/leave-table'
import { requireAdminSession } from '@/lib/supabase/session'
import { leaveQuerySchema } from '@/lib/validations/leave'
import { countByStatus, listLeave } from '@/features/leave/queries'
import { listActiveEmployees } from '@/features/employees/queries'

export const metadata: Metadata = { title: 'Leave Requests' }

type Search = Record<string, string | string[] | undefined>

export default async function AdminLeavePage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await requireAdminSession()
  const params = await searchParams
  const query = leaveQuerySchema.parse(params)

  let data: {
    records: Awaited<ReturnType<typeof listLeave>>
    counts: Record<string, number>
    employees: Array<{ id: string; full_name: string }>
  } | null = null

  try {
    const [records, counts, employees] = await Promise.all([
      listLeave(session.supabase, query, {}),
      countByStatus(session.supabase),
      listActiveEmployees(session.supabase),
    ])
    data = { records, counts, employees }
  } catch {
    data = null
  }

  return (
    <AdminShell title="Leave Requests">
      <div className="space-y-4">
        <PageHeader title="Leave Requests" description="Review and process employee leave submissions." />

        {data ? (
          <StatGrid columns={3}>
            <StatCard label="Pending" value={data.counts.pending} />
            <StatCard label="Approved" value={data.counts.approved} />
            <StatCard label="Rejected" value={data.counts.rejected} />
          </StatGrid>
        ) : null}

        <Card>
          <CardBody>
            <FilterBar
              options={{
                status: [
                  { value: '', label: 'All statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ],
                leave_type: [
                  { value: '', label: 'All types' },
                  { value: 'annual', label: 'Annual' },
                  { value: 'sick', label: 'Sick' },
                  { value: 'personal', label: 'Personal' },
                ],
                employee_id: [
                  { value: '', label: 'All employees' },
                  ...(data?.employees ?? []).map((employee) => ({ value: employee.id, label: employee.full_name })),
                ],
              }}
            />
          </CardBody>

          {!data ? (
            <ErrorState title="Unable to load leave requests" description="Leave data could not be loaded." />
          ) : (
            <>
              <LeaveTable rows={data.records.items} />
              <Pagination
                page={query.page}
                limit={query.limit}
                total={data.records.pagination.total}
                label="requests"
                buildHref={(page) => {
                  const next = new URLSearchParams()
                  for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string' && value && key !== 'page') next.set(key, value)
                  }
                  next.set('page', String(page))
                  return `/admin/leave?${next.toString()}`
                }}
              />
            </>
          )}
        </Card>
      </div>
    </AdminShell>
  )
}

