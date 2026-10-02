import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopHeader } from '@/components/layout/top-header'
import { ToastProvider } from '@/components/ui/toast'
import { requireAdminSession, requireEmployeeSession } from '@/lib/supabase/session'
import type { SupabaseClient } from '@supabase/supabase-js'

async function unreadCount(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return count ?? 0
}

/** PRD section 10: fixed sidebar, scrollable main, header on top. */
async function Shell({
  children,
  title,
  notificationsHref,
  area,
}: {
  children: React.ReactNode
  title: string
  notificationsHref: string
  area: 'admin' | 'employee'
}) {
  const session = area === 'admin' ? await requireAdminSession() : await requireEmployeeSession()
  const unread = await unreadCount(session.supabase, session.userId)

  const identity = {
    role: session.role,
    name: session.profile.full_name || session.email,
    avatarUrl: session.profile.avatar_url,
    unreadCount: unread,
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <AppSidebar {...identity} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader {...identity} title={title} notificationsHref={notificationsHref} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  )
}

export async function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <ToastProvider>
      <Shell area="admin" title={title} notificationsHref="/admin/notifications">
        {children}
      </Shell>
    </ToastProvider>
  )
}

export async function EmployeeShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <ToastProvider>
      <Shell area="employee" title={title} notificationsHref="/employee/notifications">
        {children}
      </Shell>
    </ToastProvider>
  )
}