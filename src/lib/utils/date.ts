import { APP_TIMEZONE } from '@/lib/config'

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Calendar date and minutes-of-day in the app timezone (PRD section 20). */
export function nowInAppTimezone(at: Date = new Date()) {
  const part = (type: string) => Number(formatter.formatToParts(at).find((p) => p.type === type)?.value)
  const year = part('year')
  const month = String(part('month')).padStart(2, '0')
  const day = String(part('day')).padStart(2, '0')
  return {
    date: `${year}-${month}-${day}`,
    year,
    minutes: part('hour') * 60 + part('minute'),
  }
}

/** Minutes worked on the day, with the unpaid break taken off. */
export function effectiveWorkingMinutes(raw: number, breakMinutes: number): number {
  if (breakMinutes <= 0) return raw
  // Someone who leaves before the break starts has not taken it yet.
  return raw > breakMinutes ? raw - breakMinutes : 0
}

/** Inclusive calendar-day count, PRD section 25 (total days minimum 1). */
export function totalDaysInclusive(startDate: string, endDate: string): number {
  const ms = Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)
  return Math.round(ms / 86_400_000) + 1
}

export function workingMinutes(checkIn: string, checkOut: string): number {
  return Math.max(0, Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 60_000))
}