interface Option<T extends string> {
  value: T
  label: string
  disabled?: boolean
  badge?: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  name: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`relative flex h-14 flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition-colors ${
              selected
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'
            } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            name={name}
          >
            {option.label}
            {option.badge && (
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                {option.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
