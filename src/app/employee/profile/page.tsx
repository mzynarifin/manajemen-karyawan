import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, DescriptionRow } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { ProfileAvatar } from '@/components/ui/avatar'
import { ProfileForm } from '@/components/profile/profile-form'
import { getSessionEmployee, requireEmployeeSession } from '@/lib/supabase/session'
import { formatCurrency, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Profile' }

export default async function EmployeeProfilePage() {
  const session = await requireEmployeeSession()
  const profile = session.profile

  const employee = await getSessionEmployee(session)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Profile" description="Your account and employment information." />

      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-5">
        <ProfileAvatar name={profile.full_name || profile.email} src={profile.avatar_url} size="lg" />
        <div>
          <p className="text-[15px] font-semibold text-ink">{profile.full_name || profile.email}</p>
          <p className="text-[13px] text-muted">{profile.email}</p>
          <p className="mt-1 text-xs text-muted">
            {employee
              ? `${employee.employee_code} · ${employee.departments?.name ?? 'No department'}`
              : 'Employee record not linked'}
          </p>
        </div>
      </div>

      <Card>
        <CardBody>
          <dl>
            <DescriptionRow label="Employee ID">{employee?.employee_code ?? '-'}</DescriptionRow>
            <DescriptionRow label="Department">{employee?.departments?.name ?? '-'}</DescriptionRow>
            <DescriptionRow label="Position">{employee?.position ?? '-'}</DescriptionRow>
            <DescriptionRow label="Join Date">{formatDate(employee?.join_date)}</DescriptionRow>
            <DescriptionRow label="Employment Type">
              <StatusBadge value={employee?.employment_type ?? '-'} tone="neutral" />
            </DescriptionRow>
            <DescriptionRow label="Base Salary">{formatCurrency(employee?.base_salary)}</DescriptionRow>
            <DescriptionRow label="Status">
              <StatusBadge value={employee?.status ?? 'active'} />
            </DescriptionRow>
          </dl>
        </CardBody>
      </Card>

      <ProfileForm
        role="employee"
        defaults={{
          full_name: profile.full_name,
          avatar_url: profile.avatar_url ?? '',
          phone: employee?.phone ?? '',
          address: employee?.address ?? '',
        }}
      />
    </div>
  )
}
