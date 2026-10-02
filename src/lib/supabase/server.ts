import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/config'

type CookieOptions = NonNullable<Parameters<NextResponse['cookies']['set']>[2]>
export type CookieJar = Array<{ name: string; value: string; options?: CookieOptions }>

// Supabase refreshes the session while the handler is running; those cookies
// must reach the client or the user is silently logged out. The jar is keyed
// per request so ok()/fail() can attach it without every handler threading it.
const jars = new WeakMap<NextRequest, CookieJar>()

/**
 * Supabase client bound to the caller's cookies, so all queries run under the
 * user's JWT and are filtered by the RLS policies in the migration.
 */
export function createRequestClient(req: NextRequest): { client: SupabaseClient; jar: CookieJar } {
  const jar: CookieJar = []

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          req.cookies.set(name, value)
          jar.push({ name, value, options })
        }
      },
    },
  })

  jars.set(req, jar)
  return { client, jar }
}

export function getJar(req: NextRequest): CookieJar | undefined {
  return jars.get(req)
}