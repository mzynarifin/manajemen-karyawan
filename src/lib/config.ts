function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL')
export const supabaseAnonKey = required('NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Server only. Never prefix this with NEXT_PUBLIC_ (PRD section 54).
export const supabaseServiceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY')

// App configuration kept in env instead of a settings table: it changes
// with a redeploy, never per request, and adding a table + RLS + endpoint
// for two constants would be more code than the constants themselves.
export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta'
export const ATTENDANCE_START_TIME = process.env.ATTENDANCE_START_TIME || '08:00'
export const ATTENDANCE_GRACE_MINUTES = Number(process.env.ATTENDANCE_GRACE_MINUTES ?? 0)
export const DEFAULT_ANNUAL_LEAVE = Number(process.env.DEFAULT_ANNUAL_LEAVE ?? 12)