/**
 * Sample household for the /system page and its scenarios. Invented for the playground (a design study): no real
 * people, no real money. Pages that ship replace it with real data; nothing here is proof of anything.
 */
export type PersonColour = 1 | 2 | 3 | 4 | 5
export type Role = 'parent' | 'kid'

export interface Person {
  readonly id: string
  readonly name: string
  readonly role: Role
  readonly colour: PersonColour
  readonly invited?: boolean
  /** A sample portrait (generated, public/sample/); the initials show when it is missing or fails to load. */
  readonly photo?: string
}

export const PEOPLE: readonly Person[] = [
  { id: 'ada', name: 'Ada', role: 'parent', colour: 1, photo: '/sample/avatar-ada.webp' },
  { id: 'sam', name: 'Sam', role: 'parent', colour: 2, photo: '/sample/avatar-sam.webp' },
  { id: 'ivy', name: 'Ivy', role: 'kid', colour: 3, photo: '/sample/avatar-ivy.webp' },
  { id: 'theo', name: 'Theo', role: 'kid', colour: 4, photo: '/sample/avatar-theo.webp' },
]

export const personById = (id: string): Person => PEOPLE.find((p) => p.id === id) ?? PEOPLE[0]

export type Category = 'Groceries' | 'Bills' | 'School' | 'Transport' | 'Fun' | 'Allowance' | 'Income' | 'Home'

export interface Transaction {
  readonly id: string
  readonly date: string
  readonly payee: string
  readonly person: string
  readonly category: Category
  /** Pence. Negative is money out of the kitty. */
  readonly pence: number
  readonly status?: 'pending' | 'waiting' | 'failed'
}

export const TRANSACTIONS: readonly Transaction[] = [
  { id: 't1', date: 'Today', payee: 'Tesco Express', person: 'sam', category: 'Groceries', pence: -4210 },
  { id: 't2', date: 'Today', payee: 'Pocket money', person: 'ivy', category: 'Allowance', pence: -500 },
  { id: 't3', date: 'Yesterday', payee: 'Octopus Energy', person: 'ada', category: 'Bills', pence: -8400 },
  { id: 't4', date: 'Yesterday', payee: 'School trip', person: 'ivy', category: 'School', pence: -1500, status: 'pending' },
  { id: 't5', date: 'Mon 26 Oct', payee: 'Salary', person: 'ada', category: 'Income', pence: 140000 },
  { id: 't6', date: 'Mon 26 Oct', payee: 'TfL', person: 'theo', category: 'Transport', pence: -640 },
  { id: 't7', date: 'Sun 25 Oct', payee: 'Cinema', person: 'sam', category: 'Fun', pence: -3200 },
  { id: 't8', date: 'Sat 24 Oct', payee: 'Sainsbury’s', person: 'ada', category: 'Groceries', pence: -6875 },
  { id: 't9', date: 'Fri 23 Oct', payee: 'B&Q', person: 'sam', category: 'Home', pence: -2499 },
  { id: 't10', date: 'Fri 23 Oct', payee: 'Pocket money', person: 'theo', category: 'Allowance', pence: -500 },
]

export const BALANCE_PENCE = 128450

export const SPENDING_BY_CATEGORY: readonly { category: Category; pence: number }[] = [
  { category: 'Groceries', pence: 31240 },
  { category: 'Bills', pence: 21800 },
  { category: 'Home', pence: 11480 },
  { category: 'Fun', pence: 9620 },
  { category: 'School', pence: 5400 },
  { category: 'Transport', pence: 4670 },
]

export const SPENDING_BY_PERSON: readonly { person: string; pence: number }[] = [
  { person: 'ada', pence: 40210 },
  { person: 'sam', pence: 32010 },
  { person: 'ivy', pence: 6400 },
  { person: 'theo', pence: 5590 },
]

/** The kitty's balance on each day of October, in pence (every few days). */
export const BALANCE_SERIES: readonly { label: string; pence: number }[] = [
  { label: '1 Oct', pence: 102000 },
  { label: '5 Oct', pence: 96420 },
  { label: '9 Oct', pence: 91200 },
  { label: '13 Oct', pence: 114020 },
  { label: '17 Oct', pence: 108300 },
  { label: '21 Oct', pence: 99840 },
  { label: '25 Oct', pence: 131200 },
  { label: '29 Oct', pence: 128450 },
]

export const BUDGETS: readonly { category: Category; spent: number; limit: number | null }[] = [
  { category: 'Groceries', spent: 31240, limit: 40000 },
  { category: 'Fun', spent: 9620, limit: 15000 },
  { category: 'Home', spent: 11480, limit: 10000 },
  { category: 'Transport', spent: 4670, limit: null },
]

const GBP = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

/** "£1,284.50"; with `sign`, "−£42.10" (a real minus, U+2212) or "+£1,400.00". */
export function formatPence(pence: number, { sign = false }: { sign?: boolean } = {}): string {
  const value = GBP.format(Math.abs(pence) / 100)
  return sign && pence !== 0 ? `${pence < 0 ? '−' : '+'}${value}` : value
}
