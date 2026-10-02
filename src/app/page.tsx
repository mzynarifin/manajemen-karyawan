import { redirect } from 'next/navigation'
import { getSession, homeFor } from '@/lib/supabase/session'

export default async function RootPage() {
  const session = await getSession()
  redirect(session ? homeFor(session.role) : '/login')
}