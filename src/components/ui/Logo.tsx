import { Coins } from 'lucide-react'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex size-8 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Coins className="size-[18px]" />
      </div>
      <span className="text-[17px] font-extrabold tracking-tight text-ink-900 dark:text-ink-50">Chitti Koottam</span>
    </div>
  )
}
