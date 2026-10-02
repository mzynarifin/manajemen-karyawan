import type { SupabaseClient } from '@supabase/supabase-js'
import { dbError } from '@/lib/utils/db-error'

export type ActivityItem = {
  id: string
  action: string
  entity: string
  description: string | null
  created_at: string
  profiles: { full_name: string } | null
}

/** PRD section 18: recent HR activity, newest first. */
export async function listRecentActivity(sb: SupabaseClient, limit = 8) {
  const { data, error } = await sb
    .from('audit_logs')
    .select('id, action, entity, description, created_at, profiles!audit_logs_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw dbError(error)
  return (data ?? []) as unknown as ActivityItem[]
}

export async function countAttendanceToday(sb: SupabaseClient, date: string, status: string) {
  const { count, error } = await sb
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('attendance_date', date)
    .eq('status', status)

  if (error) throw dbError(error)
  return count ?? 0
}

/** Employees with an approved leave covering today (PRD dashboard: On Leave). */
export async function countOnLeaveToday(sb: SupabaseClient, date: string) {
  const { count, error } = await sb
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')
    .lte('start_date', date)
    .gte('end_date', date)

  if (error) throw dbError(error)
  return count ?? 0
}

export async function sumPayrollPeriod(sb: SupabaseClient, month: number, year: number) {
  const { data, error } = await sb
    .from('payrolls')
    .select('net_salary, status')
    .eq('period_month', month)
    .eq('period_year', year)
    .eq('status', 'published')

  if (error) throw dbError(error)

  const rows = data ?? []
  return {
    count: rows.length,
    total: rows.reduce((sum, row) => sum + Number(row.net_salary ?? 0), 0),
  }
}

/** Employee report for the dashboard chart (PRD section 17). */
export async function departmentDistribution(sb: SupabaseClient) {
  const { data, error } = await sb
    .from('departments')
    .select('id, name, employees(count)')
    .order('name')

  if (error) throw dbError(error)

  return ((data ?? []) as Array<{ id: string; name: string; employees: Array<{ count: number }> }>).map((row) => ({
    id: row.id,
    name: row.name,
    count: row.employees?.[0]?.count ?? 0,
  }))
}

export async function employeeStatusCounts(sb: SupabaseClient) {
  const [active, inactive] = await Promise.all([
    sb.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
  ])

  return { active: active.count ?? 0, inactive: inactive.count ?? 0 }
}