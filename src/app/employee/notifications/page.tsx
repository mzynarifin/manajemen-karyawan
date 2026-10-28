import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody } from '@/components/ui/card'
import { Pagination, type PaginationParams } from '@/components/ui/pagination'
import { FilterBar } from '@/components/ui/filter-bar'
import { ErrorState } from '@/components/ui/states'
import { NotificationList } from '@/components/notifications/notification-list'
import { requireEmployeeSession } from '@/lib/supabase/session'
import { listNotifications } from '@/services/notification.service'
import { parseNotificationFilters } from '@/lib/validations/notification'

export const metadata: Metadata = { title: 'Notifications' }

const LIMIT = 20

const filters = {
  is_read: [
    { value: '', label: 'All' },
    { value: 'false', label: 'Unread' },
    { value: 'true', label: 'Read' },
  ],
  type: [
    { value: '', label: 'All types' },
    { value: 'leave', label: 'Leave' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'employee', label: 'Employee' },
    { value: 'system', label: 'System' },
  ],
}

export default async function EmployeeNotificationsPage({ searchParams }: { searchParams: Promise<PaginationParams> }) {
  const session = await requireEmployeeSession()
  const params = await searchParams

  const page = Math.max(1, Number(params.page) || 1)
  const { isRead, type } = parseNotificationFilters(params)

  let data: Awaited<ReturnType<typeof listNotifications>> | null = null
  try {
    data = await listNotifications(session.supabase, { userId: session.userId, page, limit: LIMIT, isRead, type })
  } catch {
    data = null
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" description="Updates about your leave, payroll and account." />

      <Card>
        <CardBody>
          <FilterBar options={filters} />
        </CardBody>

        {!data ? (
          <ErrorState title="Unable to load notifications" />
        ) : (
          <>
            <NotificationList items={data.items} />
            <Pagination
              page={page}
              limit={LIMIT}
              total={data.pagination.total}
              label="notifications"
              basePath="/employee/notifications"
              searchParams={params}
            />
          </>
        )}
      </Card>
    </div>
  )
}
