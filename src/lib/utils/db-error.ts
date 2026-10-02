import { AppError } from '@/lib/api-response'

type DbError = { code?: string; message?: string; details?: string } | null

// Codes raised by the plpgsql functions in supabase/migrations/0001. PostgREST
// returns the raise message verbatim, so the string is the contract.
// ponytail: keep in sync with the migration; a typed error enum is overkill here.
const RPC_ERRORS: Record<string, { status: number; message: string }> = {
  FORBIDDEN: { status: 403, message: 'Admin access required' },
  LEAVE_NOT_FOUND: { status: 404, message: 'Leave request not found' },
  LEAVE_ALREADY_REVIEWED: { status: 409, message: 'Leave request has already been reviewed' },
  LEAVE_BALANCE_NOT_FOUND: { status: 404, message: 'Leave balance not found for that period' },
  LEAVE_BALANCE_INSUFFICIENT: { status: 409, message: 'Leave balance is not enough for this request' },
  REASON_REQUIRED: { status: 400, message: 'Rejection reason is required' },
  EMPLOYEE_NOT_FOUND: { status: 404, message: 'Employee not found' },
  PAYROLL_NOT_FOUND: { status: 404, message: 'Payroll not found' },
  PAYROLL_ALREADY_PUBLISHED: { status: 409, message: 'Payroll has already been published' },
  EMPLOYEE_CODE_EXISTS: { status: 409, message: 'Employee code already exists' },
  EMAIL_ALREADY_EXISTS: { status: 409, message: 'Email already exists' },
  ACCOUNT_CREATE_FAILED: { status: 400, message: 'Failed to create account' },
}

export function dbError(error: DbError, fallbackStatus = 500): AppError {
  const code = error?.message ?? ''
  const known = RPC_ERRORS[code]
  if (known) return new AppError(code, known.message, known.status)

  if (error?.code === '23505') {
    if (error.details?.includes('employee_code')) return new AppError('EMPLOYEE_CODE_EXISTS', 'Employee code already exists', 409)
    if (error.details?.includes('email')) return new AppError('EMAIL_ALREADY_EXISTS', 'Email already exists', 409)
    return new AppError('DUPLICATE_RESOURCE', 'Resource already exists', 409, error.details)
  }

  if (error?.code === 'PGRST116' || error?.code === 'PT02') {
    return new AppError('NOT_FOUND', 'Resource not found', 404)
  }

  console.error('[db] error', error)
  return new AppError(error?.code || 'DATABASE_ERROR', error?.message || 'Database error', fallbackStatus)
}