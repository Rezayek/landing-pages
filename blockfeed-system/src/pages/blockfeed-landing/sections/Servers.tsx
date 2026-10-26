/**
 * S4 Servers (Q4: "Are the servers real, or ads with fake player counts?"). The working finder, labelled as a sample.
 * Filters replace the list in place; the count is announced; Copy address answers "Copied" for 1.5 s and, when the
 * clipboard is blocked, selects the text and says how to copy it. No Join button: nothing here can join.
 */
import { useMemo, useRef, useState, type JSX, type MouseEvent } from 'react'
import { Button } from '@/system/ui'
import { filterServers, NO_FILTERS, ServerFilterBar, ServerRow, type ServerFilters } from '@/system/social'
import { SERVERS } from '@/system/social/fixtures'
import { announce, EmptyState, FEEDBACK_TIMING } from '@/system/feedback'
import './page.css'
import './servers.css'

/** The four sample servers shown (the finder filters these four). */
const SAMPLE = SERVERS.slice(0, 4)

const COPY_FAIL_HOLD = FEEDBACK_TIMING.successHoldMs * 4

export function Servers(): JSX.Element {
  const [filters, setFilters] = useState<ServerFilters>(NO_FILTERS)
  const matched = useMemo(() => filterServers(SAMPLE, filters), [filters])
  const root = useRef<HTMLDivElement>(null)
  const timers = useRef(new WeakMap<Element, ReturnType<typeof setTimeout>>())
  // The count is spoken by ServerFilterBar's own status line; announcing it here too would say it twice.

  function clearFilters(): void {
    setFilters(NO_FILTERS)
    // the empty state leaves the page: keep focus in the finder
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('.bf-filters__row button')?.focus())
  }

  /** Copy address, in the page's words: "Copied" for 1.5 s, or select the text and say how to copy it. */
  function onCopyCapture(event: MouseEvent<HTMLDivElement>): void {
    const button = (event.target as Element).closest('.bf-copy button')
    const field = button?.closest<HTMLElement>('.bf-copy')
    if (!button || !field) return
    event.stopPropagation() // replaces the system field's own toast
    const valueEl = field.querySelector<HTMLElement>('.bf-copy__value')
    const label = field.querySelector('.bf-copy__label')?.textContent ?? 'Address'
    const value = valueEl?.textContent ?? ''
    const pending = timers.current.get(field)
    if (pending) clearTimeout(pending)
    const rest = (state: 'ok' | 'fail', hold: number): void => {
      field.dataset.copied = state
      timers.current.set(
        field,
        setTimeout(() => {
          delete field.dataset.copied
        }, hold),
      )
    }
    // a missing or blocked clipboard throws or rejects: both take the same path
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(value))
      .then(
      () => {
        rest('ok', FEEDBACK_TIMING.successHoldMs)
        announce(`${label} copied`)
      },
      () => {
        if (valueEl) {
          const range = document.createRange()
          range.selectNodeContents(valueEl)
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
        rest('fail', COPY_FAIL_HOLD)
        announce('Select the text and copy it')
      },
    )
  }

  return (
    <section id="servers" className="bl-section bl-servers" data-y="16" data-y-label="servers" aria-labelledby="servers-title">
      <div className="bl-inner" ref={root}>
        <header className="bl-head">
          <h2 id="servers-title" className="bl-h2">
            Find a server to play on.
          </h2>
          <p className="bl-lede">Filter by version, mode, region or players online. Every server shows its ping and an address to copy.</p>
        </header>
        <ServerFilterBar value={filters} onChange={setFilters} resultCount={matched.length} />
        <div className="bl-servers__list" onClickCapture={onCopyCapture}>
          {matched.length === 0 ? (
            <EmptyState
              kind="no-results"
              title="No servers match. Try another version or mode."
              className="bl-servers__empty"
              action={
                <Button variant="secondary" icon="cross" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            matched.map((server) => <ServerRow key={server.id} server={server} />)
          )}
        </div>
        <p className="bl-note">Sample servers. Player counts and pings here are not live.</p>
      </div>
    </section>
  )
}
