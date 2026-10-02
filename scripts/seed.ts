/**
 * Development seed, PRD section 89 + 90.
 *
 * Run: npm run seed   (reads .env.local, needs the service role key)
 *
 * Self-contained on purpose: it talks to Supabase with the service role
 * directly instead of importing src/lib helpers, so it stays runnable by plain
 * node without a bundler. Do not use these accounts in production.
 */
import { createClient } from '@supabase/supabase-js'

const URL = required('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY = required('SUPABASE_SERVICE_ROLE_KEY')

const DEFAULT_ANNUAL_LEAVE = Number(process.env.DEFAULT_ANNUAL_LEAVE ?? 12)

const ADMIN = { email: 'admin@sentraakarya.test', password: 'Admin#2026hris', full_name: 'Rina Hartati' }
const DEPARTMENTS = [
  { name: 'Human Resources', description: 'People, culture and legal' },
  { name: 'Engineering', description: 'Product engineering' },
  { name: 'Finance', description: 'Accounting and payroll' },
  { name: 'Marketing', description: 'Brand and demand' },
  { name: 'Operations', description: 'Logistics and facilities' },
]
const POSITIONS = [
  { position: 'HR Business Partner', department: 'Human Resources', salary: 9_500_000 },
  { position: 'Backend Engineer', department: 'Engineering', salary: 12_000_000 },
  { position: 'Frontend Engineer', department: 'Engineering', salary: 11_000_000 },
  { position: 'QA Engineer', department: 'Engineering', salary: 8_500_000 },
  { position: 'Payroll Officer', department: 'Finance', salary: 8_000_000 },
  { position: 'Accountant', department: 'Finance', salary: 7_500_000 },
  { position: 'Digital Marketer', department: 'Marketing', salary: 7_000_000 },
  { position: 'Content Writer', department: 'Marketing', salary: 6_500_000 },
  { position: 'Operations Staff', department: 'Operations', salary: 6_000_000 },
  { position: 'Logistics Coordinator', department: 'Operations', salary: 6_200_000 },
]
const NAMES = [
  'Andi Saputra', 'Bela lestari', 'Citra Dewi', 'Dimas Nugroho', 'Elsa Maharani',
  'Fajar Prasetyo', 'Gita Anggraini', 'Hendra Kusuma', 'Indah Permata', 'Joko Santoso',
]

type SeedEmployee = { id: string; userId: string; name: string; salary: number }

const db = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  const existing = await findUserByEmail(ADMIN.email)
  if (existing) {
    console.log(`Seed skipped: ${ADMIN.email} already exists.`)
    return
  }

  const departmentIds = await seedDepartments()
  const adminId = await seedAdmin()
  const employees = await seedEmployees(departmentIds, adminId)
  await seedAttendance(employees)
  await seedLeave(employees)
  await seedPayroll(employees, adminId)

  console.log('\nSeed complete.')
  console.log(`  admin    : ${ADMIN.email} / ${ADMIN.password}`)
  console.log(`  employee : ${employeeEmail(1)} / ${employeePassword(1)}`)
  console.log(`  employee : ${employeeEmail(2)} / ${employeePassword(2)}`)
}

async function seedDepartments() {
  const ids: Record<string, string> = {}
  for (const department of DEPARTMENTS) {
    const { data, error } = await db.from('departments').upsert(department, { onConflict: 'name' }).select('id').single()
    if (error) throw error
    ids[department.name] = data.id
  }
  console.log(`departments: ${DEPARTMENTS.length}`)
  return ids
}

async function seedAdmin() {
  const { data, error } = await db.auth.admin.createUser({
    email: ADMIN.email,
    password: ADMIN.password,
    email_confirm: true,
    user_metadata: { full_name: ADMIN.full_name },
  })
  if (error) throw error

  // The signup trigger always creates role = employee, so promote explicitly.
  const { error: roleError } = await db.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
  if (roleError) throw roleError

  console.log(`admin: ${ADMIN.email}`)
  return data.user.id
}

async function seedEmployees(departmentIds: Record<string, string>, actorId: string) {
  const employees: SeedEmployee[] = []

  for (const [index, spec] of POSITIONS.entries()) {
    const number = index + 1
    const email = employeeEmail(number)
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: employeePassword(number),
      email_confirm: true,
      user_metadata: { full_name: NAMES[index] },
    })
    if (error) throw error

    const { data: employeeId, error: rpcError } = await db.rpc('create_employee', {
      p_actor_id: actorId,
      p_user_id: data.user.id,
      p_employee_code: `EMP-${String(number).padStart(4, '0')}`,
      p_full_name: NAMES[index],
      p_gender: number % 2 === 0 ? 'female' : 'male',
      p_birth_date: `19${80 + number}-0${(number % 9) + 1}-1${number % 9}`,
      p_phone: `0812000000${number}`,
      p_address: `Jl. 示例 No. ${number}, Jakarta`,
      p_department_id: departmentIds[spec.department],
      p_position: spec.position,
      p_join_date: `202${number % 4}-0${(number % 9) + 1}-01`,
      p_employment_type: number % 4 === 0 ? 'contract' : 'permanent',
      p_base_salary: spec.salary,
      p_avatar_url: null,
      p_default_annual_leave: DEFAULT_ANNUAL_LEAVE,
    })
    if (rpcError) throw rpcError

    employees.push({ id: employeeId as string, userId: data.user.id, name: NAMES[index], salary: spec.salary })
  }

  console.log(`employees: ${employees.length}`)
  return employees
}

async function seedAttendance(employees: SeedEmployee[]) {
  const year = new Date().getUTCFullYear()
  const month = String(new Date().getUTCMonth() + 1).padStart(2, '0')
  const rows = []

  for (const [index, employee] of employees.entries()) {
    for (let day = 1; day <= 3; day += 1) {
      const late = (index + day) % 4 === 0
      const checkIn = `${year}-${month}-${String(day).padStart(2, '0')}T0${late ? 8 : 7}:${String(index * 5).padStart(2, '0')}:00+07:00`
      const checkOut = `${year}-${month}-${String(day).padStart(2, '0')}T17:0${day}:00+07:00`
      rows.push({
        employee_id: employee.id,
        attendance_date: `${year}-${month}-${String(day).padStart(2, '0')}`,
        check_in: checkIn,
        check_out: checkOut,
        working_minutes: late ? 480 : 540,
        status: late ? 'late' : 'present',
      })
    }
  }

  const { error } = await db.from('attendance').upsert(rows, { onConflict: 'employee_id,attendance_date' })
  if (error) throw error
  console.log(`attendance: ${rows.length}`)
}

async function seedLeave(employees: SeedEmployee[]) {
  const year = new Date().getUTCFullYear()
  const month = String(new Date().getUTCMonth() + 1).padStart(2, '0')
  const types = ['annual', 'sick', 'personal']
  const rows = []
  const usedByEmployee: Record<string, number> = {}

  for (const [index, employee] of employees.entries()) {
    const startDay = String((index % 20) + 5).padStart(2, '0')
    const totalDays = (index % 3) + 1
    const start = `${year}-${month}-${startDay}`
    const end = `${year}-${month}-${String((index % 20) + 5 + totalDays - 1).padStart(2, '0')}`
    const status = index % 3 === 0 ? 'pending' : index % 3 === 1 ? 'approved' : 'rejected'

    rows.push({
      employee_id: employee.id,
      leave_type: types[index % types.length],
      start_date: start,
      end_date: end,
      total_days: totalDays,
      reason: `Seeded ${types[index % types.length]} request for testing`,
      status,
      rejection_reason: status === 'rejected' ? 'Seeded rejection reason' : null,
      reviewed_by: status === 'pending' ? null : employees[0].userId,
      reviewed_at: status === 'pending' ? null : new Date().toISOString(),
    })

    if (status === 'approved' && types[index % types.length] === 'annual') {
      usedByEmployee[employee.id] = totalDays
    }
  }

  const { error } = await db.from('leave_requests').insert(rows)
  if (error) throw error

  // Keep leave_balances consistent with the approved requests above.
  for (const [employeeId, days] of Object.entries(usedByEmployee)) {
    const { data: balance } = await db
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .maybeSingle()

    if (!balance) continue
    await db
      .from('leave_balances')
      .update({ used_leave: days, remaining_leave: balance.total_leave - days })
      .eq('id', balance.id)
  }

  console.log(`leave requests: ${rows.length}`)
}

async function seedPayroll(employees: SeedEmployee[], actorId: string) {
  const now = new Date()
  const periodMonth = now.getUTCMonth() + 1
  const periodYear = now.getUTCFullYear()
  const rows = []

  for (const [index, employee] of employees.entries()) {
    const allowance = 1_000_000
    const bonus = (index % 3) * 500_000
    const deduction = 200_000
    const published = index % 4 !== 0

    rows.push({
      employee_id: employee.id,
      period_month: periodMonth,
      period_year: periodYear,
      base_salary: employee.salary,
      allowance,
      bonus,
      deduction,
      net_salary: employee.salary + allowance + bonus - deduction,
      status: published ? 'published' : 'draft',
      published_at: published ? now.toISOString() : null,
      created_by: actorId,
    })
  }

  const { data, error } = await db.from('payrolls').insert(rows).select('id, employee_id, status')
  if (error) throw error

  const published = (data ?? []).filter((row) => row.status === 'published')
  for (const row of published) {
    const employee = employees.find((item) => item.id === row.employee_id)
    if (!employee) continue
    await db.from('notifications').insert({
      user_id: employee.userId,
      title: 'Slip gaji tersedia',
      message: `Slip gaji ${periodMonth}/${periodYear} sudah dipublish.`,
      type: 'payroll',
      reference_id: row.id,
    })
  }

  console.log(`payrolls: ${rows.length} (${published.length} published)`)
}

async function findUserByEmail(email: string) {
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find((user) => user.email === email)
    if (match) return match
    if (data.users.length < 200) return null
  }
  return null
}

function employeeEmail(number: number) {
  return `employee${String(number).padStart(2, '0')}@sentraakarya.test`
}

function employeePassword(number: number) {
  return `Employee#${number}2026`
}

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})