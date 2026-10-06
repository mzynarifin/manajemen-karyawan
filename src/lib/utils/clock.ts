/**
 * Clock helpers with no env dependency, safe to import from client components.
 * Keep env access (APP_TIMEZONE and friends) in @/lib/utils/date and @/lib/config,
 * which only run on the server.
 */

/** "08:00" -> 480 */
export function parseClock(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/**
 * Postgres `time` arrives as "08:00:00" while <input type="time"> wants
 * "08:00", so shift times are trimmed to the hour-minute pair on the way in.
 */
export function toClock(value: string | null | undefined): string | null {
  return value ? value.slice(0, 5) : null
}
