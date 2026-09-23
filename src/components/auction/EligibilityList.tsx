import { Check, X } from 'lucide-react'
import type { EligibilityResult } from '@/types'
import { Card } from '@/components/ui/Card'

export function EligibilityList({ eligibility }: { eligibility: EligibilityResult[] }) {
  const eligible = eligibility.filter((r) => r.eligible)
  const ineligible = eligibility.filter((r) => !r.eligible)

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-ink-900 dark:text-ink-50">Lot Eligibility</h3>
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{eligible.length} eligible</span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {[...eligible, ...ineligible].map((r) => (
          <li key={r.member.id} className="flex items-center gap-2.5">
            {r.eligible ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
                <Check className="size-3.5" />
              </span>
            ) : (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600 dark:bg-danger-500/20 dark:text-danger-300">
                <X className="size-3.5" />
              </span>
            )}
            <div className="min-w-0">
              <p className={`truncate font-semibold ${r.eligible ? 'text-ink-900 dark:text-ink-50' : 'text-ink-400 dark:text-ink-500'}`}>
                {r.member.name}
              </p>
              {!r.eligible && r.reason && <p className="text-xs text-danger-500 dark:text-danger-400">{r.reason}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
