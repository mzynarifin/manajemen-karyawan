import type { Role } from '@/types'

/**
 * Single source of truth for navigation. Both the sidebar links and the header
 * title are derived from it, so a new section only needs to be added once.
 */
type NavItem = {
  href: string
  label: string
  icon: 'dashboard' | 'employees' | 'attendance' | 'leave' | 'payroll' | 'reports' | 'notifications' | 'profile'
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/employees', label: 'Employees', icon: 'employees' },
  { href: '/admin/attendance', label: 'Attendance', icon: 'attendance' },
  { href: '/admin/leave', label: 'Leave Requests', icon: 'leave' },
  { href: '/admin/payroll', label: 'Payroll', icon: 'payroll' },
  { href: '/admin/reports', label: 'Reports', icon: 'reports' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
  { href: '/admin/profile', label: 'Profile', icon: 'profile' },
]

export const EMPLOYEE_NAV: NavItem[] = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/employee/attendance', label: 'Attendance', icon: 'attendance' },
  { href: '/employee/leave', label: 'Leave', icon: 'leave' },
  { href: '/employee/payslip', label: 'Payslip', icon: 'payroll' },
  { href: '/employee/reports', label: 'My Reports', icon: 'reports' },
  { href: '/employee/notifications', label: 'Notifications', icon: 'notifications' },
  { href: '/employee/profile', label: 'Profile', icon: 'profile' },
]

export function navFor(role: Role): NavItem[] {
  return role === 'admin' ? ADMIN_NAV : EMPLOYEE_NAV
}

export function isActiveNav(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Header title for the current route, so pages do not thread it by hand. */
export function sectionTitle(pathname: string, role: Role): string {
  const nav = navFor(role)
  return nav.find((item) => isActiveNav(pathname, item.href))?.label ?? ''
}