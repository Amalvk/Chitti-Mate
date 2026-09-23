import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface FieldWrapperProps {
  label: string
  error?: string
  hint?: string
  htmlFor: string
  children: ReactNode
  suffix?: ReactNode
}

export function FieldWrapper({ label, error, hint, htmlFor, children, suffix }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-700 dark:text-ink-200">
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-ink-400 dark:text-ink-500">
            {suffix}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-danger-600 dark:text-danger-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-400 dark:text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  suffix?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, suffix, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <FieldWrapper label={label} error={error} hint={hint} htmlFor={inputId} suffix={suffix}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={`h-12 w-full rounded-2xl border bg-white px-4 text-[15px] text-ink-900 placeholder:text-ink-300 outline-none transition-shadow focus:ring-2 focus:ring-brand-300 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-600 dark:focus:ring-brand-500/40 ${
          error ? 'border-danger-300 dark:border-danger-500/50' : 'border-ink-200 dark:border-ink-700'
        } ${className}`}
        {...props}
      />
    </FieldWrapper>
  )
})
