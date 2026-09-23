import { Link } from 'react-router-dom'
import { ChevronRight, Coins, Info, Shield, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useTheme } from '@/context/ThemeContext'

export function More() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">More</h1>

      <Card>
        <p className="mb-3 text-sm font-semibold text-ink-700 dark:text-ink-200">Appearance</p>
        <SegmentedControl
          name="theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <Card padded={false} className="divide-y divide-ink-100 overflow-hidden dark:divide-ink-800">
        <Link
          to="/admin/chittis"
          className="flex items-center gap-3 px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-800"
        >
          <Wallet className="size-5 text-ink-500 dark:text-ink-400" />
          <span className="flex-1 font-semibold text-ink-800 dark:text-ink-100">All Chittis</span>
          <ChevronRight className="size-4 text-ink-300 dark:text-ink-600" />
        </Link>
        <div className="flex items-center gap-3 px-5 py-4 opacity-60">
          <Shield className="size-5 text-ink-500 dark:text-ink-400" />
          <div className="flex-1">
            <p className="font-semibold text-ink-800 dark:text-ink-100">Authentication</p>
            <p className="text-xs text-ink-400 dark:text-ink-500">Coming soon</p>
          </div>
        </div>
        <Link to="/" className="flex items-center gap-3 px-5 py-4 hover:bg-ink-50 dark:hover:bg-ink-800">
          <Info className="size-5 text-ink-500 dark:text-ink-400" />
          <span className="flex-1 font-semibold text-ink-800 dark:text-ink-100">About Chitty Mate</span>
          <ChevronRight className="size-4 text-ink-300 dark:text-ink-600" />
        </Link>
      </Card>

      <div className="flex items-center gap-2 px-1 text-xs text-ink-400 dark:text-ink-500">
        <Coins className="size-3.5" /> Chitty Mate · v0.1 MVP
      </div>
    </div>
  )
}
