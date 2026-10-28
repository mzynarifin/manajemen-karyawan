/**
 * Payroll period and net-salary helpers shared by the server services and the
 * client forms, so the live preview in the form always matches what gets saved.
 */

export type PayrollAmounts = {
  base_salary: number
  allowance: number
  bonus: number
  deduction: number
}

/** PRD section 34. Money is rounded to 2 decimals to avoid float drift. */
export function netSalary(amounts: PayrollAmounts): number {
  const net = amounts.base_salary + amounts.allowance + amounts.bonus - amounts.deduction
  return Math.round(net * 100) / 100
}

/** Sortable period key, e.g. 2026-07. Used as the payslip's period identity. */
export function payrollPeriodKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Numeric month options, for form values and server-side validation. */
export const PERIOD_MONTHS = MONTH_LABELS.map((label, index) => ({ value: index + 1, label }))

/** String month options, for <select value> bindings in client components. */
export function periodMonthOptions(): Array<{ value: string; label: string }> {
  return PERIOD_MONTHS.map(({ value, label }) => ({ value: String(value), label }))
}

/**
 * Current year plus four back, so the list never goes stale like a hardcoded
 * one. Rendered at request time on the server and on first paint on the client.
 */
export function periodYears(span = 4): number[] {
  const current = new Date().getFullYear()
  return Array.from({ length: span + 1 }, (_, index) => current - index)
}

export function periodYearOptions(span = 4): Array<{ value: string; label: string }> {
  return periodYears(span).map((year) => ({ value: String(year), label: String(year) }))
}