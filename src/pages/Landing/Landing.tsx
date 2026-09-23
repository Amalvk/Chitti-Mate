import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowRight, Coins, Eye, ShieldCheck, Timer, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ensureDemoData, DEMO_CHITTI_ID } from '@/data/demoData'

export function Landing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<'admin' | 'view' | null>(null)

  async function handleEnterAdmin() {
    setLoading('admin')
    try {
      await ensureDemoData()
      navigate('/admin')
    } catch {
      toast.error('Could not connect to Firebase. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleViewDemo() {
    setLoading('view')
    try {
      await ensureDemoData()
      navigate(`/chitti/${DEMO_CHITTI_ID}`)
    } catch {
      toast.error('Could not connect to Firebase. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink-50 dark:bg-ink-950">
      <header className="flex items-center justify-between px-5 pt-[max(1.5rem,env(safe-area-inset-top))] md:px-10 md:pt-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-10 md:max-w-2xl">
        <div className="animate-slide-up flex flex-col items-start gap-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Coins className="size-3.5" /> Digital Chitti Management
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl dark:text-ink-50">
            Manage your chitti.
            <br />
            Track payments.
            <br />
            <span className="text-brand-600 dark:text-brand-400">Run every lot</span> with confidence.
          </h1>
          <p className="max-w-md text-base text-ink-500 dark:text-ink-400">
            ChittiFlow keeps every cycle, payment and winner in one place — shared with your
            members in real time.
          </p>

          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              icon={<ArrowRight className="size-4" />}
              loading={loading === 'admin'}
              onClick={handleEnterAdmin}
            >
              Enter Demo Admin
            </Button>
            <Button
              size="lg"
              variant="secondary"
              icon={<Eye className="size-4" />}
              loading={loading === 'view'}
              onClick={handleViewDemo}
            >
              View Demo Chitti
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FeatureCard icon={<Timer className="size-5" />} title="Live countdowns" desc="Real-time auction timers" />
          <FeatureCard icon={<Trophy className="size-5" />} title="Fair lots" desc="Transparent, eligibility-checked" />
          <FeatureCard icon={<ShieldCheck className="size-5" />} title="Trusted history" desc="Every winner, permanently" />
        </div>
      </main>

      <footer className="px-6 pb-6 text-center text-xs text-ink-400 dark:text-ink-500">
        Chitti Koottam · Authentication coming soon
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-none">
      <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        {icon}
      </div>
      <p className="text-sm font-bold text-ink-900 dark:text-ink-50">{title}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{desc}</p>
    </div>
  )
}
