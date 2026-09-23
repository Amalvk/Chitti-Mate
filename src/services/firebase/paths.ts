import { collection, doc } from 'firebase/firestore'
import type { Chitti, Cycle, Member, Payment } from '@/types'
import { makeConverter } from './converter'
import { db } from './config'

const chittiConverter = makeConverter<Chitti>()
const memberConverter = makeConverter<Member>()
const cycleConverter = makeConverter<Cycle>()
const paymentConverter = makeConverter<Payment>()

export const chittisCol = () => collection(db, 'chittis').withConverter(chittiConverter)
export const chittiDoc = (chittiId: string) =>
  doc(db, 'chittis', chittiId).withConverter(chittiConverter)

export const membersCol = (chittiId: string) =>
  collection(db, 'chittis', chittiId, 'members').withConverter(memberConverter)
export const memberDoc = (chittiId: string, memberId: string) =>
  doc(db, 'chittis', chittiId, 'members', memberId).withConverter(memberConverter)

export const cyclesCol = (chittiId: string) =>
  collection(db, 'chittis', chittiId, 'cycles').withConverter(cycleConverter)
export const cycleDoc = (chittiId: string, cycleId: string) =>
  doc(db, 'chittis', chittiId, 'cycles', cycleId).withConverter(cycleConverter)

export const paymentsCol = (chittiId: string, cycleId: string) =>
  collection(db, 'chittis', chittiId, 'cycles', cycleId, 'payments').withConverter(
    paymentConverter,
  )
export const paymentDoc = (chittiId: string, cycleId: string, memberId: string) =>
  doc(db, 'chittis', chittiId, 'cycles', cycleId, 'payments', memberId).withConverter(
    paymentConverter,
  )
