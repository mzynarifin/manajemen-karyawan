import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseServiceRoleKey, supabaseUrl } from '@/lib/config'

let cached: SupabaseClient | undefined

/**
 * Service role client: bypasses RLS, so only for privileged operations that
 * the route already gated on an admin session (PRD section 54, 77).
 * Server only - importing this from a client component would leak the key.
 */
export function getAdminClient(): SupabaseClient {
  cached ??= createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return cached
}