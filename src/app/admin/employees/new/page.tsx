import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { EmployeeCreateForm } from '@/components/employees/employee-create-form'
import { requireAdminSession } from '@/lib/supabase/session'
import { listDepartments } from '@/features/employees/queries'

export const metadata: Metadata = { title: 'Add Employee' }

export default async function NewEmployeePage() {
  const session = await requireAdminSession()
  const departments = await listDepartments(session.supabase)

  return (
    <AdminShell title="Add Employee">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to Employees
        </Link>

        <PageHeader title="Add Employee" description="Create the employee record and its sign-in account." />

        <EmployeeCreateForm departments={departments} />
      </div>
    </AdminShell>
  )
}