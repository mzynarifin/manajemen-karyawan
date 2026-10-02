/**
 * PRD section 78: backend error codes -> human sentences.
 * Backend validation stays the source of truth; this only changes wording.
 */
const MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'You need to sign in again.',
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  ACCOUNT_INACTIVE: 'This account is inactive. Contact HR.',
  FORBIDDEN: 'You do not have permission to do that.',
  EMPLOYEE_NOT_FOUND: 'Employee not found.',
  EMPLOYEE_INACTIVE: 'This employee is inactive.',
  EMAIL_ALREADY_EXISTS: 'That email is already used by another account.',
  EMPLOYEE_CODE_EXISTS: 'That employee ID is already taken.',
  EMPLOYEE_ALREADY_EXISTS: 'That employee already exists.',
  ACCOUNT_CREATE_FAILED: 'The account could not be created. Check the email and try again.',
  ATTENDANCE_ALREADY_EXISTS: 'You already checked in today.',
  CHECK_IN_REQUIRED: 'Check in first before checking out.',
  CHECK_OUT_ALREADY_EXISTS: 'You already checked out today.',
  LEAVE_NOT_FOUND: 'Leave request not found.',
  LEAVE_ALREADY_REVIEWED: 'This leave request has already been reviewed.',
  LEAVE_BALANCE_INSUFFICIENT: 'Your remaining leave balance is not enough for this request.',
  LEAVE_BALANCE_NOT_FOUND: 'No leave balance exists for that period yet.',
  LEAVE_DATE_CONFLICT: 'These dates overlap an approved leave request.',
  REASON_REQUIRED: 'A rejection reason is required.',
  PAYROLL_NOT_FOUND: 'Payroll not found.',
  PAYROLL_ALREADY_EXISTS: 'A payroll for this employee and period already exists.',
  PAYROLL_ALREADY_PUBLISHED: 'This payroll is already published.',
  NET_SALARY_INVALID: 'The net salary cannot be negative.',
  DUPLICATE_RESOURCE: 'That record already exists.',
  VALIDATION_ERROR: 'Please check the highlighted fields.',
  NOT_FOUND: 'The requested record was not found.',
  NOTIFICATION_NOT_FOUND: 'Notification not found.',
  DEPARTMENT_NOT_FOUND: 'Department not found.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
}

export function errorMessage(code: string | undefined, fallback = MESSAGES.INTERNAL_ERROR): string {
  if (!code) return fallback
  return MESSAGES[code] ?? fallback
}

/** Validation errors come back as { field, message } pairs (PRD section 63). */
export type FieldIssue = { field: string; message: string }

export function fieldIssues(details: unknown): FieldIssue[] {
  if (!Array.isArray(details)) return []
  return details.filter(
    (item): item is FieldIssue => typeof item === 'object' && item !== null && 'field' in item && 'message' in item,
  )
}