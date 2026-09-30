import { collection, doc } from 'firebase/firestore'
import type { Chitti, Contribution, Cycle, Member, Payment, TreasureGroup, TreasureMember } from '@/types'
import { makeConverter } from './converter'
import { db } from './config'

const chittiConverter = makeConverter<Chitti>()
const memberConverter = makeConverter<Member>()
const cycleConverter = makeConverter<Cycle>()
const paymentConverter = makeConverter<Payment>()
const treasureGroupConverter = makeConverter<TreasureGroup>()
const treasureMemberConverter = makeConverter<TreasureMember>()
const contributionConverter = makeConverter<Contribution>()

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

// Treasure — savings groups, entirely separate from chittis (no fixed amount
// or period, no lot/auction; members just contribute whenever they can).
export const treasureGroupsCol = () => collection(db, 'treasureGroups').withConverter(treasureGroupConverter)
export const treasureGroupDoc = (groupId: string) =>
  doc(db, 'treasureGroups', groupId).withConverter(treasureGroupConverter)

export const treasureMembersCol = (groupId: string) =>
  collection(db, 'treasureGroups', groupId, 'members').withConverter(treasureMemberConverter)
export const treasureMemberDoc = (groupId: string, memberId: string) =>
  doc(db, 'treasureGroups', groupId, 'members', memberId).withConverter(treasureMemberConverter)

export const contributionsCol = (groupId: string) =>
  collection(db, 'treasureGroups', groupId, 'contributions').withConverter(contributionConverter)
export const contributionDoc = (groupId: string, contributionId: string) =>
  doc(db, 'treasureGroups', groupId, 'contributions', contributionId).withConverter(
    contributionConverter,
  )
