import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['#2979ff', '#3d9eff', '#10b981', '#f59e0b', '#1e63e0']

interface Piece {
  id: number
  left: number
  color: string
  delay: number
  duration: number
  rotate: number
  size: number
}

/** A tasteful, brief confetti burst — not a childish full-screen shower. */
export function Confetti({ count = 28 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.3,
        duration: 1.6 + Math.random() * 0.8,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 5,
      })),
    [count],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: 380, opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}
