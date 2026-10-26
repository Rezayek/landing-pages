/**
 * The sample household the page shows, captured 2026-10-23 from `src/system/ui/sample.ts` (invented for the system
 * playground). Nothing here is proof: every place it appears says "Sample household". Kitty has no users yet.
 */
import { personById } from '@/system/ui'
import type { LedgerLine } from '@/system/ui'

export const SAMPLE_CAPTURED = '2026-10-23'

/** The kitty's balance before the visitor approves Ivy's request, and after. */
export const BALANCE_PENCE = 128450
export const TRIP_PENCE = 500

/** This week in the hero ledger, newest first. */
export const WEEK: readonly LedgerLine[] = [
  { id: 'w1', day: 'Fri', person: personById('ivy'), what: 'Pocket money', pence: -500 },
  { id: 'w2', day: 'Thu', person: personById('sam'), what: 'Tesco Express', pence: -4210 },
  { id: 'w3', day: 'Thu', person: personById('ada'), what: 'Octopus Energy, split 4 ways', pence: -8400 },
  { id: 'w4', day: 'Wed', person: personById('theo'), what: 'TfL top-up', note: 'Sam said yes', stamp: 'Approved', pence: -640 },
]

/** One line per section of the scroll story (UX.md §Sections): written into the side ledger as each one is read. */
export const STORY_LINES: Readonly<Record<'kitty' | 'split' | 'pocket' | 'ask' | 'where', LedgerLine>> = {
  kitty: { id: 's-kitty', day: 'Mon', person: personById('ada'), what: 'Salary', pence: 140000 },
  split: { id: 's-split', day: 'Thu', person: personById('ada'), what: 'Octopus Energy, split 4 ways', pence: -8400 },
  pocket: { id: 's-pocket', day: 'Fri', person: personById('ivy'), what: 'Pocket money', pence: -500 },
  ask: { id: 's-ask', day: 'Wed', person: personById('ivy'), what: 'School trip, approved by Sam', pence: -1500 },
  where: { id: 's-where', day: 'Sat', person: personById('ada'), what: 'Sainsbury’s', pence: -6875 },
}

/** The request in the story's "Kids ask" step (sample). */
export const THEO_REQUEST = { kid: 'theo', pence: 1200, reason: 'Football boots, the old ones split', when: 'Today, 16:20' } as const

/** A week in the sample household (S-week): what lands on each day, in person colours. */
export const WEEK_DAYS: readonly { day: string; items: readonly { who: string; what: string; pence: number }[] }[] = [
  { day: 'Mon', items: [{ who: 'ada', what: 'Salary in', pence: 140000 }, { who: 'theo', what: 'TfL', pence: -640 }] },
  { day: 'Tue', items: [{ who: 'sam', what: 'Cinema', pence: -3200 }] },
  { day: 'Wed', items: [{ who: 'ivy', what: 'Asked for the trip', pence: -1500 }] },
  { day: 'Thu', items: [{ who: 'ada', what: 'Octopus, split 4 ways', pence: -8400 }, { who: 'sam', what: 'Tesco Express', pence: -4210 }] },
  { day: 'Fri', items: [{ who: 'ivy', what: 'Pocket money', pence: -500 }, { who: 'theo', what: 'Pocket money', pence: -500 }] },
  { day: 'Sat', items: [{ who: 'ada', what: 'Sainsbury’s', pence: -6875 }, { who: 'sam', what: 'B&Q', pence: -2499 }] },
  { day: 'Sun', items: [] },
]

/** The kitty card in S2: this week per person (spent), in and out. Out matches the hero's lines: £137.50. */
export const KITTY_MEMBERS = [
  { person: personById('ada'), spentPence: 8400 },
  { person: personById('sam'), spentPence: 4210 },
  { person: personById('ivy'), spentPence: 500 },
  { person: personById('theo'), spentPence: 640 },
] as const
export const MONEY_IN_PENCE = 140000
export const MONEY_OUT_PENCE = 13750

/** The bill split in S3. */
export const BILL = { payee: 'Octopus Energy', pence: 8400, paidBy: 'ada' } as const

/** Ivy's envelope in S4. */
export const IVY_ALLOWANCE = { amount: 500, rhythm: 'Friday', next: 'Fri 30 Oct', spent: 1800, saved: 1200 } as const

/** S5: the sample month's budget line (Groceries over by £12.40). */
export const GROCERIES_BUDGET = { category: 'Groceries', spent: 31240, limit: 30000 } as const
