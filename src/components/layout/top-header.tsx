'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { ProfileAvatar } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { MobileSidebar } from '@/components/layout/app-sidebar'
import type { Role } from '@/types'

type Props = {
  role: Role
  name: string
  avatarUrl: string | null
  unreadCount: number
  title: string
  notificationsHref: string
}

/** PRD section 10 + 14: page context, notifications, avatar. Nothing else. */
export function TopHeader({ role, name, avatarUrl, unreadCount, title, notificationsHref }: Props) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileSidebar role={role} name={name} avatarUrl={avatarUrl} unreadCount={unreadCount} />
        <h2 className="truncate text-[15px] font-semibold text-ink">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Link
          href={notificationsHref}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink"
        >
          <Bell className="h-4 w-4" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-medium leading-4 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2.5 border-l border-line pl-3">
          <ProfileAvatar name={name} src={avatarUrl} size="sm" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[13px] font-medium leading-4 text-ink">{name}</p>
            <p className="truncate text-[11px] leading-4 text-muted">
              {role === 'admin' ? 'HR / Admin' : 'Employee'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}