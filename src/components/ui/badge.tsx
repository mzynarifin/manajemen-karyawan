
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const TONES: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  neutral: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

export const STATUS_TONE: Record<string, Tone> = {
  // PRD section 59
  active: 'success',
  present: 'success',
  approved: 'success',
  published: 'success',
  pending: 'warning',
  late: 'warning',
  draft: 'neutral',
  rejected: 'danger',
  inactive: 'neutral',
  absent: 'danger',
}

const LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  leave: 'Leave',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  draft: 'Draft',
  published: 'Published',
  permanent: 'Permanent',
  contract: 'Contract',
  annual: 'Annual',
  sick: 'Sick',
  personal: 'Personal',
}

export function StatusBadge({ value, tone }: { value: string; tone?: Tone }) {
  const resolved = tone ?? STATUS_TONE[value] ?? 'neutral'
  const label = LABELS[value] ?? value

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[resolved]}`}
    >
      {label}
    </span>
  )
}

export function Badge({ value, tone = 'neutral' }: { value: string; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {LABELS[value] ?? value}
    </span>
  )
}
