import { errorMessage, fieldIssues } from '@/lib/error-messages'

export type ActionResult<T = unknown> =
  | { ok: true; message: string; data: T }
  | { ok: false; message: string; code?: string; fieldErrors?: Record<string, string> }

export function actionSuccess<T>(message: string, data?: T): ActionResult<T> {
  return { ok: true, message, data: data as T }
}

type BackendError = {
  success?: false
  message?: string
  error?: string
  details?: unknown
}

/**
 * Services throw AppError / return nothing, but the browser needs a sentence.
 * Kept in one place so every action formats failures identically.
 */
export function actionFailure(error: unknown, fallbackCode = 'INTERNAL_ERROR'): { ok: false; message: string; code?: string; fieldErrors?: Record<string, string> } {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as BackendError & { code?: string }
    const code = candidate.error ?? candidate.code
    const message = candidate.message

    if (message) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of fieldIssues(candidate.details)) fieldErrors[issue.field] = issue.message
      return { ok: false, message, code, fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined }
    }

    if (code) return { ok: false, message: errorMessage(code), code }
  }

  return { ok: false, message: errorMessage(fallbackCode), code: fallbackCode }
}