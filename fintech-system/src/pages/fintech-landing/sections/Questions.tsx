/**
 * S6 Questions (UX.md, A12): plain answers, including the open ones. Every open answer says it is open (BRIEF.md
 * open questions 1-3); nothing here claims safety, a price or a date.
 */
import type { JSX } from 'react'
import { Accordion } from '@/system/ui'

export const QUESTIONS = [
  {
    id: 'q-money',
    title: 'Who holds the money?',
    body: 'We haven’t named who will hold the money yet, so we make no claim about how it is protected. We’ll say both here, and in our email to you, before Kitty opens. Until then Kitty holds nothing: the waitlist only takes your email address.',
  },
  {
    id: 'q-cost',
    title: 'What does it cost?',
    body: 'Joining the waitlist is free. We haven’t published a price yet. We’ll put it here, and in our email to you, before Kitty opens.',
  },
  {
    id: 'q-kids',
    title: 'Can I see kids’ spending?',
    body: 'You see every payment, with the name of who made it. When a kid wants more than their pocket money, they ask in the app and a parent says yes or no.',
  },
  {
    id: 'q-bank',
    title: 'Do we leave our bank?',
    body: 'Joining the waitlist asks you to change nothing. We’ll explain how money gets into the kitty before Kitty opens.',
  },
  {
    id: 'q-when',
    title: 'When can we start?',
    body: 'There’s no date yet. When there is one, everyone on the waitlist gets an email.',
  },
  {
    id: 'q-email',
    title: 'What about my email?',
    body: '[Privacy line: open, asked 2026-10-23]',
  },
] as const

export function Questions({ openId }: { openId: string | null }): JSX.Element {
  return (
    <section id="questions" className="fl-paper" aria-labelledby="questions-title">
      <h2 id="questions-title" className="fl-h2">
        Plain answers, including the ones we don’t have yet
      </h2>
      <div className="fl-questions">
        <Accordion key={openId ?? 'closed'} items={QUESTIONS.map((q) => ({ id: q.id, anchor: q.id, title: q.title, body: <p>{q.body}</p> }))} defaultOpen={openId ? [openId] : undefined} />
      </div>
    </section>
  )
}
