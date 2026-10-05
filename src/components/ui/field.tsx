'use client'

import { forwardRef, useId } from 'react'

type FieldProps = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode
}

/** PRD section 24 + 63: label, field, hint, error - never an input per card. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-0.5 text-red-500 dark:text-red-400">*</span>}
      </label>
      <div className="mt-1.5">
        {children({
          id,
          'aria-invalid': Boolean(error),
          'aria-describedby': error ? errorId : hint ? hintId : undefined,
        })}
      </div>
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return <input ref={ref} className={`field-control ${className}`} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`field-control h-auto py-2 ${className}`} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...props }, ref) {
    return (
      <select ref={ref} className={`field-control pr-8 ${className}`} {...props}>
        {children}
      </select>
    )
  },
)

type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
}

/** Digits only, always formatted as Rp on the right (PRD section 33). */
export function CurrencyInput({ value, onValueChange, className = '', ...props }: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">Rp</span>
      <input
        {...props}
        inputMode="numeric"
        className={`field-control pl-9 text-right tabular-nums ${className}`}
        value={value ? Number(value).toLocaleString('id-ID') : ''}
        onChange={(event) => onValueChange(event.target.value.replace(/\D/g, ''))}
      />
    </div>
  )
}