import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { getJar } from '@/lib/supabase/server'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

type OkPayload = {
  success: true
  message: string
  data?: unknown
  pagination?: unknown
}

function respond(body: unknown, status: number, req?: NextRequest) {
  const res = NextResponse.json(body, { status })
  for (const cookie of (req && getJar(req)) || []) {
    res.cookies.set(cookie.name, cookie.value, cookie.options)
  }
  return res
}

/** Success envelope, PRD section 61. */
export function ok(
  data: unknown,
  message: string,
  options?: { status?: number; pagination?: unknown; req?: NextRequest },
) {
  const body: OkPayload = { success: true, message, data }
  if (options?.pagination) body.pagination = options.pagination
  return respond(body, options?.status ?? 200, options?.req)
}

/** Error envelope, PRD section 61. Never leaks stack traces or SQL. */
export function fail(error: unknown, req?: NextRequest) {
  if (error instanceof AppError) {
    return respond(
      { success: false, message: error.message, error: error.code, details: error.details },
      error.status,
      req,
    )
  }

  if (error instanceof ZodError) {
    return respond(
      {
        success: false,
        message: 'Validation failed',
        error: 'VALIDATION_ERROR',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      422,
      req,
    )
  }

  const dbError = error as { code?: string; message?: string; details?: string } | null
  if (dbError?.code === '23505') {
    return respond(
      { success: false, message: 'Resource already exists', error: 'DUPLICATE_RESOURCE', details: dbError.details },
      409,
      req,
    )
  }

  console.error('[api] unhandled error', error)
  return respond({ success: false, message: 'Internal server error', error: 'INTERNAL_ERROR' }, 500, req)
}

/** Parses and validates a JSON body (PRD section 63). */
export async function readJson<T>(req: NextRequest, schema: { parse: (v: unknown) => T }): Promise<T> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new AppError('INVALID_JSON', 'Request body must be valid JSON', 400)
  }
  return schema.parse(raw)
}

/** Parses and validates search params (PRD section 69-72). */
export function readQuery<T>(req: NextRequest, schema: { parse: (v: unknown) => T }): T {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams))
}