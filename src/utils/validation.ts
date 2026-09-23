import type { ChittiDuration, SelectionMethod } from '@/types'

export interface CreateChittiFormValues {
  name: string
  amount: string
  commission: string
  duration: ChittiDuration
  startDate: string
  selectionMethod: SelectionMethod
  auctionDate: string
  auctionTime: string
}

export interface FieldErrors {
  [key: string]: string | undefined
}

/** `membersCount` drives both the "at least 2 members" rule and the commission-vs-pot check. */
export function validateCreateChittiForm(values: CreateChittiFormValues, membersCount: number): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.name.trim()) errors.name = 'Chitti name is required'

  const amount = Number(values.amount)
  const validAmount = !!values.amount && !Number.isNaN(amount) && amount > 0
  if (!validAmount) {
    errors.amount = 'Enter a valid contribution amount'
  }

  if (values.commission) {
    const commission = Number(values.commission)
    if (Number.isNaN(commission) || commission < 0) {
      errors.commission = 'Enter a valid commission amount'
    } else if (validAmount && commission >= amount * membersCount) {
      errors.commission = 'Commission cannot be more than the total pot'
    }
  }

  if (membersCount < 2) errors.members = 'Add at least 2 members'

  if (!values.startDate) errors.startDate = 'Start date is required'

  if (!values.auctionDate || !values.auctionTime) {
    errors.auction = 'Auction date & time is required'
  }

  return errors
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function validateMemberForm(name: string, phone: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = 'Name is required'
  if (phone.trim() && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
    errors.phone = 'Enter a valid 10-digit phone number'
  }
  return errors
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return phone
  return `${digits.slice(0, 2)}xxxxxx${digits.slice(-2)}`
}
