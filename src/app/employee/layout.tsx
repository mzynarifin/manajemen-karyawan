import { Shell } from '@/components/layout/shell'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <Shell area="employee">{children}</Shell>
}
