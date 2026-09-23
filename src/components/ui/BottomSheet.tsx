import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  dismissible?: boolean
}

export function BottomSheet({ open, onClose, title, children, dismissible = true }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px] dark:bg-black/60"
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="safe-bottom relative w-full max-w-lg rounded-t-3xl bg-white p-5 pt-3 sm:rounded-3xl sm:mb-8 dark:bg-ink-900"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink-200 sm:hidden dark:bg-ink-700" />
            {(title || dismissible) && (
              <div className="mb-3 flex items-center justify-between">
                {title && <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h2>}
                {dismissible && (
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="ml-auto flex size-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
