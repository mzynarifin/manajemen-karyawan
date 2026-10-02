const DATE = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const DATE_LONG = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

/** PRD section 80: 02 Oct 2026 */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value)
  return date ? DATE.format(date) : '-'
}

/** 02 October 2026 */
export function formatDateLong(value: string | Date | null | undefined): string {
  const date = toDate(value)
  return date ? DATE_LONG.format(date) : '-'
}

/** 08:02 */
export function formatTime(value: string | Date | null | undefined): string {
  const date = toDate(value)
  return date ? TIME.format(date) : '-'
}

/** 02 Oct 2026, 08:02 */
export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value)
  return date ? `${DATE.format(date)}, ${TIME.format(date)}` : '-'
}

/** Working minutes -> 9h 00m */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-'
  const hours = Math.floor(minutes / 60)
  const rest = Math.abs(minutes % 60)
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${rest}m`
}

/** PRD section 33: Rp7.300.000 */
export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return 'Rp0'
  return `Rp${Math.round(amount).toLocaleString('id-ID')}`
}

/** Compact money for KPI: Rp7,3 jt */
export function formatCurrencyShort(value: number | null | undefined): string {
  const amount = Number(value ?? 0)
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} M`
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1).replace('.', ',')} jt`
  if (amount >= 1_000) return `Rp${Math.round(amount / 1_000)} rb`
  return formatCurrency(amount)
}

export function formatMonthYear(month: number, year: number): string {
  const label = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  )
  return label
}

export function formatPeriod(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${year}`
}

/** "5 minutes ago" style, used in notification and activity lists. */
export function formatRelative(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return '-'

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return formatDate(date)
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const TYPE_LABELS: Record<string, string> = {
  annual: 'Annual',
  sick: 'Sick',
  personal: 'Personal',
}

export function labelOf(value: string | null | undefined): string {
  if (!value) return '-'
  if (TYPE_LABELS[value]) return TYPE_LABELS[value]
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function pluralDays(days: number): string {
  return `${days} day${days === 1 ? '' : 's'}`
}