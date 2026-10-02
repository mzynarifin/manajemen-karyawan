import type { Metadata } from 'next'
import { AdminShell } from '@/components/layout/shell'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardBody, DescriptionRow } from '@/components/ui/card'
import { ProfileAvatar } from '@/components/ui/avatar'
import { ProfileForm } from '@/components/profile/profile-form'
import { requireAdminSession } from '@/lib/supabase/session'
import { formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Profile' }

export default async function AdminProfilePage() {
  const session = await requireAdminSession()
  const profile = session.profile

  return (
    <AdminShell title="Profile">
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader title="Profile" description="Your account information and preferences." />

        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-5">
          <ProfileAvatar name={profile.full_name || profile.email} src={profile.avatar_url} size="lg" />
          <div>
            <p className="text-[15px] font-semibold text-ink">{profile.full_name || profile.email}</p>
            <p className="text-[13px] text-muted">{profile.email}</p>
            <p className="mt-1 text-xs text-muted">HR / Admin account since {formatDate(profile.created_at)}</p>
          </div>
        </div>

        <Card>
          <CardBody>
            <dl>
              <DescriptionRow label="Role">HR / Admin</DescriptionRow>
              <DescriptionRow label="Email">{profile.email}</DescriptionRow>
              <DescriptionRow label="Status">{profile.is_active ? 'Active' : 'Inactive'}</DescriptionRow>
              <DescriptionRow label="Last Updated">{formatDate(profile.updated_at)}</DescriptionRow>
            </dl>
          </CardBody>
        </Card>

        <ProfileForm
          role="admin"
          defaults={{ full_name: profile.full_name, avatar_url: profile.avatar_url ?? '', phone: '', address: '' }}
        />
      </div>
    </AdminShell>
  )
}