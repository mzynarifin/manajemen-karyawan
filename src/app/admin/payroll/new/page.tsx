import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { PayrollCreateForm } from '@/components/payroll/payroll-create-form'
import { requireAdminSession } from '@/lib/supabase/session'
import { listActiveEmployees, listDepartments } from '@/features/employees/queries'

export const metadata: Metadata = { title: 'Create Payroll' }

export default async function NewPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ employee_id?: string }>
}) {
  const session = await requireAdminSession()
  const params = await searchParams
  // One row per employee is rendered, so the picker needs every active employee
  // rather than the default page-sized slice.
  const [employees, departments] = await Promise.all([
    listActiveEmployees(session.supabase, undefined, 500),
    listDepartments(session.supabase),
  ])

  return (
    <AdminShell title="Create Payroll">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/admin/payroll"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to Payroll
        </Link>

        <PageHeader
          title="Create Payroll"
          description="Pick several employees to create one draft payroll each for the same period."
        />

        <PayrollCreateForm employees={employees} departments={departments} defaultEmployeeId={params.employee_id} />
      </div>
    </AdminShell>
  )
}