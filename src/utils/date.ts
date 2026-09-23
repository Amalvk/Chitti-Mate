import type { ChittiDuration } from '@/types'

export interface CountdownParts {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

/** Computes a countdown breakdown from `now` to `targetIso`, always derived from real clock time. */
export function getCountdownParts(targetIso: string, now: number = Date.now()): CountdownParts {
  const target = new Date(targetIso).getTime()
  const totalMs = target - now
  const isPast = totalMs <= 0
  const clamped = Math.max(totalMs, 0)

  const totalSeconds = Math.floor(clamped / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { totalMs, days, hours, minutes, seconds, isPast }
}

export function formatCountdown(parts: CountdownParts): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (parts.days > 0) {
    return `${parts.days}d ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
  }
  return `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function formatMonthName(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long' })
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`
}

/**
 * Local (not UTC) calendar date as `YYYY-MM-DD`, matching what a native date
 * input expects and what a user actually perceives as "today" — unlike
 * `toISOString().slice(0, 10)`, which reads the UTC date and rolls over
 * several hours early for any timezone ahead of UTC (e.g. IST, UTC+5:30).
 */
function toLocalDateInputValue(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayDateInputValue(): string {
  return toLocalDateInputValue(new Date())
}

export function toDateInputValue(iso: string): string {
  return toLocalDateInputValue(new Date(iso))
}

export function toTimeInputValue(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function combineDateAndTime(dateValue: string, timeValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hours, minutes] = timeValue.split(':').map(Number)
  return new Date(year, (month ?? 1) - 1, day, hours ?? 0, minutes ?? 0).toISOString()
}

/** Advances a date by one chitti cycle period (used to project the next auction date). */
export function addCyclePeriod(iso: string, duration: ChittiDuration): string {
  const d = new Date(iso)
  if (duration === 'weekly') {
    d.setDate(d.getDate() + 7)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString()
}

export function isPast(iso: string, now: number = Date.now()): boolean {
  return new Date(iso).getTime() <= now
}
