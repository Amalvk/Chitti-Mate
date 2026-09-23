import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
}

export function Card({ children, padded = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl bg-white border border-ink-100 shadow-soft dark:bg-ink-900 dark:border-ink-800 dark:shadow-none ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
