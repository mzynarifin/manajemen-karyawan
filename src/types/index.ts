export type Role = 'admin' | 'employee'
export type EmployeeStatus = 'active' | 'inactive'
export type EmploymentType = 'permanent' | 'contract'
export type Gender = 'male' | 'female'
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave'
export type LeaveType = 'annual' | 'sick' | 'personal'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type PayrollStatus = 'draft' | 'published'
export type NotificationType = 'leave' | 'payroll' | 'employee' | 'system'

// ponytail: hand-written row types instead of `supabase gen types`. Run
// `supabase gen types typescript --linked` and delete this file when the
// generated Database type is worth the extra indirection.
export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  user_id: string | null
  employee_code: string
  full_name: string
  gender: Gender | null
  birth_date: string | null
  phone: string | null
  address: string | null
  department_id: string | null
  position: string | null
  join_date: string | null
  employment_type: EmploymentType | null
  base_salary: number
  status: EmployeeStatus
  work_start: string | null
  work_end: string | null
  break_minutes: number
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  attendance_date: string
  check_in: string
  check_out: string | null
  working_minutes: number | null
  status: AttendanceStatus
  created_at: string
  updated_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  year: number
  total_leave: number
  used_leave: number
  remaining_leave: number
  created_at: string
  updated_at: string
}

export interface Payroll {
  id: string
  employee_id: string
  period_month: number
  period_year: number
  base_salary: number
  allowance: number
  bonus: number
  deduction: number
  net_salary: number
  status: PayrollStatus
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  reference_id: string | null
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  description: string | null
  created_at: string
}