import { Shell } from '@/components/layout/shell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell area="admin">{children}</Shell>
}
