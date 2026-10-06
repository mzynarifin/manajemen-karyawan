'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleUser,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Users,
  X,
} from 'lucide-react'
import { logoutAction } from '@/features/auth/actions'
import { ProfileAvatar } from '@/components/ui/avatar'
import type { Role } from '@/types'

const ADMIN_MENU = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/attendance', label: 'Attendance', icon: CheckCircle2 },
  { href: '/admin/leave', label: 'Leave Requests', icon: ClipboardList },
  { href: '/admin/payroll', label: 'Payroll', icon: Receipt },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/profile', label: 'Profile', icon: CircleUser },
]

const EMPLOYEE_MENU = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/attendance', label: 'Attendance', icon: CheckCircle2 },
  { href: '/employee/leave', label: 'Leave', icon: CalendarDays },
  { href: '/employee/payslip', label: 'Payslip', icon: Receipt },
  { href: '/employee/reports', label: 'My Reports', icon: FileText },
  { href: '/employee/notifications', label: 'Notifications', icon: Bell },
  { href: '/employee/profile', label: 'Profile', icon: CircleUser },
]

export type SidebarProps = {
  role: Role
  name: string
  avatarUrl: string | null
  unreadCount: number
}

/** PRD section 11-13: 240px, white, subtle right border, no card per item. */
export function AppSidebar({ role, name, avatarUrl, unreadCount }: SidebarProps) {
  const pathname = usePathname()
  const menu = role === 'admin' ? ADMIN_MENU : EMPLOYEE_MENU
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logoutAction()
  }

  return (
    <div className="flex h-full w-60 flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-line px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-700 text-[11px] font-bold text-white">
          SK
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">Sentra Karya</p>
          <p className="truncate text-[11px] text-muted">HRIS</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {menu.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          const badge = item.href.endsWith('/notifications') && unreadCount > 0 ? unreadCount : null

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                  : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              {badge && (
                <span className="rounded-full bg-brand-700 px-1.5 text-[11px] font-medium leading-4 text-white">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <ProfileAvatar name={name} src={avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{name}</p>
            <p className="truncate text-[11px] text-muted">{role === 'admin' ? 'HR / Admin' : 'Employee'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {loggingOut ? 'Signing out...' : 'Logout'}
        </button>
      </div>
    </div>
  )
}

/** PRD section 70: sidebar becomes a drawer on mobile. */
export function MobileSidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition-colors duration-150 hover:text-ink lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative h-full w-60">
            <AppSidebar {...props} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-2 top-3.5 rounded-md p-1.5 text-muted hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  )
}