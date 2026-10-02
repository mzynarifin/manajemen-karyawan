const PREFIX = 'EMP-'

/** EMP-0001, EMP-0002, ... PRD section 10. */
export function nextEmployeeCode(lastCode: string | null | undefined): string {
  const last = lastCode?.startsWith(PREFIX) ? Number(lastCode.slice(PREFIX.length)) : 0
  const next = Number.isFinite(last) && last > 0 ? last + 1 : 1
  return `${PREFIX}${String(next).padStart(4, '0')}`
}