/**
 * The bookend (UX.md S6, S7): the household's ledger book, open. The questions lie on its ruled page as a paper and the
 * waitlist as a tear-off slip; both settle onto the table as they scroll in (CSS scroll-driven, MOTION.md "Papers settle").
 */
import type { JSX } from 'react'
import { Join } from './Join'
import { Questions } from './Questions'

export function Table({ openId }: { openId: string | null }): JSX.Element {
  return (
    <div className="fl-table" data-moment="table">
      <div className="fl-table__papers">
        <Questions openId={openId} />
        <Join />
      </div>
    </div>
  )
}
