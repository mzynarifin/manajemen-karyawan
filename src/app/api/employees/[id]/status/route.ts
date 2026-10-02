import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { fail, ok, readJson } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth/require-auth'
import { parseId } from '@/lib/validations/common'
import { setEmployeeActive } from '@/services/employee.service'

type Context = { params: Promise<{ id: string }> }

const statusSchema = z.object({ status: z.enum(['active', 'inactive']) })

/**
 * PRD section 11 + 58: soft delete only. `inactive` also flips the profile so
 * the account can no longer pass requireAuth.
 */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const auth = await requireAdmin(req)
    const id = parseId((await params).id)
    const { status } = await readJson(req, statusSchema)

    const result = await setEmployeeActive(id, status === 'active', auth.userId)
    return ok(result, `Employee marked as ${status}`, { req })
  } catch (error) {
    return fail(error, req)
  }
}