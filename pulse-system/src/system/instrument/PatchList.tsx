/**
 * The patch bank (COMPONENTS.md, Patch list): a bank filter (radio group of jacks) over a listbox of patches. It is
 * presentational: the scenario that owns it decides loading, empty and error, and passes them in, so every state
 * can be driven by the /system controls.
 */
import { useId, useRef, type CSSProperties, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Spinner } from '../feedback'
import { Led, type LedState } from './display'

export type PatchType = 'bass' | 'lead' | 'pad' | 'fx'
export type RowStatus = 'stored' | 'saving' | 'saved' | 'waiting' | 'syncing' | 'synced' | 'failed'

export interface PatchRow {
  readonly id: string
  readonly number: number
  readonly name: string
  readonly type: PatchType
  readonly mine?: boolean
  readonly status?: RowStatus
}

export type BankFilter = 'all' | PatchType | 'mine'
export const BANK_FILTERS: readonly { id: BankFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bass', label: 'Bass' },
  { id: 'lead', label: 'Lead' },
  { id: 'pad', label: 'Pad' },
  { id: 'fx', label: 'FX' },
  { id: 'mine', label: 'Yours' },
]

const STATUS: Record<RowStatus, { led: LedState; word: string } | null> = {
  stored: null,
  saving: { led: 'blink', word: 'Saving' },
  saved: { led: 'on', word: 'Saved' },
  waiting: { led: 'warning', word: 'Waiting to sync' },
  syncing: { led: 'blink', word: 'Syncing' },
  synced: { led: 'positive', word: 'Synced' },
  failed: { led: 'negative', word: "Couldn't sync" },
}

export interface PatchListProps {
  filter: BankFilter
  onFilter: (f: BankFilter) => void
  rows: readonly PatchRow[]
  selectedId: string | null
  loadingId: string | null
  /** the row whose spinner is visible (after the indicator delay) */
  spinnerId?: string | null
  onLoad: (row: PatchRow) => void
  /** shown instead of the rows: a skeleton, an empty state or an error state */
  status?: ReactNode
  busy?: boolean
  dim?: boolean
  /** a quiet action at the end of a failed row */
  rowAction?: (row: PatchRow) => ReactNode
}

export function PatchList({
  filter,
  onFilter,
  rows,
  selectedId,
  loadingId,
  spinnerId,
  onLoad,
  status,
  busy = false,
  dim = false,
  rowAction,
}: PatchListProps): JSX.Element {
  const legendId = useId()
  const listId = useId()
  const filterRefs = useRef<(HTMLButtonElement | null)[]>([])
  const optionRefs = useRef<(HTMLLIElement | null)[]>([])

  function onFilterKey(e: KeyboardEvent<HTMLElement>): void {
    const i = BANK_FILTERS.findIndex((f) => f.id === filter)
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = (i + dir + BANK_FILTERS.length) % BANK_FILTERS.length
    onFilter(BANK_FILTERS[next].id)
    filterRefs.current[next]?.focus()
  }

  function onListKey(e: KeyboardEvent<HTMLElement>, index: number): void {
    const go = (i: number): void => {
      e.preventDefault()
      optionRefs.current[Math.max(0, Math.min(rows.length - 1, i))]?.focus()
    }
    if (e.key === 'ArrowDown') go(index + 1)
    else if (e.key === 'ArrowUp') go(index - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(rows.length - 1)
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onLoad(rows[index])
    } else if (e.key.length === 1) {
      const i = rows.findIndex((r, j) => j > index && r.name.toLowerCase().startsWith(e.key.toLowerCase()))
      if (i >= 0) go(i)
    }
  }

  return (
    <div className="pi-bank" data-dim={dim || undefined}>
      <div className="pi-bank__filters">
        <span className="pi-legend" id={legendId}>
          Bank
        </span>
        <div role="radiogroup" aria-labelledby={legendId} className="pi-bank__filter-row" onKeyDown={onFilterKey}>
          {BANK_FILTERS.map((f, i) => (
            <button
              key={f.id}
              ref={(el) => {
                filterRefs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              tabIndex={filter === f.id ? 0 : -1}
              className="pi-tab"
              onClick={() => onFilter(f.id)}
            >
              <span className="pi-tab__led" aria-hidden="true" />
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="pi-bank__region" aria-busy={busy || undefined}>
        {status ?? (
          <ul id={listId} role="listbox" aria-label="Patch bank" className="pi-bank__list">
            {rows.map((row, i) => {
              const s = row.status ? STATUS[row.status] : null
              return (
                <li
                  key={row.id}
                  ref={(el) => {
                    optionRefs.current[i] = el
                  }}
                  role="option"
                  aria-selected={selectedId === row.id}
                  aria-busy={loadingId === row.id || undefined}
                  tabIndex={(selectedId ?? rows[0]?.id) === row.id ? 0 : -1}
                  className="pi-patch"
                  data-status={row.status}
                  onClick={() => onLoad(row)}
                  onKeyDown={(e) => onListKey(e, i)}
                >
                  <span className="pi-patch__num">{String(row.number).padStart(3, '0')}</span>
                  <span className="pi-patch__name">{row.name}</span>
                  <span className="pi-patch__type">{spinnerId === row.id ? <Spinner size="sm" /> : row.type.toUpperCase()}</span>
                  <span className="pi-patch__state">
                    {s ? <Led state={s.led} word={s.word} /> : selectedId === row.id ? <Led state="on" word="Loaded" /> : null}
                    {rowAction?.(row)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/** A skeleton the exact size of the list: vent-slot rows. */
export function PatchListSkeleton({ rows = 6 }: { rows?: number }): JSX.Element {
  return (
    <ul className="pi-bank__list" aria-hidden="true" data-vfx="vent-scan">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="pi-patch pi-patch--skeleton" style={{ '--i': i } as CSSProperties}>
          <span className="pi-vent" />
        </li>
      ))}
    </ul>
  )
}
