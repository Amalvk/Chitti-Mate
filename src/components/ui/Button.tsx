import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'md' | 'lg' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-soft disabled:bg-ink-200 disabled:text-ink-400 dark:shadow-none dark:disabled:bg-ink-800 dark:disabled:text-ink-600',
  secondary:
    'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 active:bg-ink-100 disabled:text-ink-300 dark:bg-ink-900 dark:text-ink-100 dark:border-ink-700 dark:hover:bg-ink-800 dark:active:bg-ink-700 dark:disabled:text-ink-600',
  ghost:
    'bg-transparent text-ink-700 hover:bg-ink-100 active:bg-ink-200 disabled:text-ink-300 dark:text-ink-200 dark:hover:bg-ink-800 dark:active:bg-ink-700 dark:disabled:text-ink-600',
  outline:
    'bg-transparent border border-brand-300 text-brand-700 hover:bg-brand-50 disabled:border-ink-200 disabled:text-ink-300 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10 dark:disabled:border-ink-700 dark:disabled:text-ink-600',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600 shadow-soft disabled:bg-ink-200 disabled:text-ink-400 dark:shadow-none dark:disabled:bg-ink-800 dark:disabled:text-ink-600',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-12 px-5 text-[15px] gap-2 rounded-2xl',
  lg: 'h-14 px-6 text-base gap-2 rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, loading, icon, className = '', children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-colors duration-150 select-none disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="size-[1.1em] animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})
