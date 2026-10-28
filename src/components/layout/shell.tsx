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

/**
 * PRD section 10: fixed sidebar, scrollable main, header on top.
 *
 * Lives in the route layout, not in each page, so the chrome survives
 * navigation: a page's loading.tsx then swaps only the content area instead of
 * tearing down the sidebar and header.
 */
export async function Shell({ children, area }: { children: React.ReactNode; area: 'admin' | 'employee' }) {
  const session = area === 'admin' ? await requireAdminSession() : await requireEmployeeSession()
  // The navigation badge does not need to hold up the page. Passing the
  // request promise lets the small badge boundaries resolve after the shell.
  const unread = unreadCount(session.supabase, session.userId)

  const identity = {
    role: session.role,
    name: session.profile.full_name || session.email,
    avatarUrl: session.profile.avatar_url,
    unreadCount: unread,
  }
  const notificationsHref = area === 'admin' ? '/admin/notifications' : '/employee/notifications'

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-canvas">
        <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <AppSidebar {...identity} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader {...identity} notificationsHref={notificationsHref} />
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
