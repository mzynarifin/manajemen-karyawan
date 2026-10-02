import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { PayrollCreateForm } from '@/components/payroll/payroll-create-form'
import { requireAdminSession } from '@/lib/supabase/session'
import { listActiveEmployees } from '@/features/employees/queries'

export const metadata: Metadata = { title: 'Create Payroll' }

export default async function NewPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ employee_id?: string }>
}) {
  const session = await requireAdminSession()
  const params = await searchParams
  const employees = await listActiveEmployees(session.supabase)

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

        <PageHeader title="Create Payroll" description="New payroll records start as draft and can be edited." />

        <PayrollCreateForm employees={employees} defaultEmployeeId={params.employee_id} />
      </div>
    </AdminShell>
  )
}