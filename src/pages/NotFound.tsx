import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-50 px-6 text-center dark:bg-ink-950">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        <Compass className="size-7" />
      </div>
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">Page not found</h1>
      <p className="max-w-xs text-ink-500 dark:text-ink-400">The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </div>
  )
}
