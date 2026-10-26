import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from '../feedback'
import { SectionTitle } from './SectionTitle'
import { Icon, type IconName } from './icons'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'

/** Traps Tab inside `ref` while open, closes on Esc, focuses `initial` (or the first focusable), restores focus. */
function useModal(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void, initial?: string): void {
  const latest = useRef(onClose)
  useEffect(() => {
    latest.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const before = document.activeElement as HTMLElement | null
    const root = ref.current
    const first = (initial && root?.querySelector<HTMLElement>(initial)) || root?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        latest.current()
      } else if (event.key === 'Tab' && root) {
        const list = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
        if (!list.length) return
        const head = list[0]
        const tail = list[list.length - 1]
        if (event.shiftKey && document.activeElement === head) {
          event.preventDefault()
          tail.focus()
        } else if (!event.shiftKey && document.activeElement === tail) {
          event.preventDefault()
          head.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      before?.focus()
    }
  }, [ref, open, initial])
}

/**
 * Dialog (alert, confirm, form): a decision that cannot wait. The title draws its gold-start rule; focus goes to the
 * least destructive action (`initialFocus`), Esc cancels, focus returns to the trigger. Destructive confirms are
 * `alertdialog`. The scrim click closes only non-destructive dialogs.
 */
export function Dialog({
  open,
  title,
  children,
  actions,
  onClose,
  kind = 'dialog',
  initialFocus,
}: {
  open: boolean
  title: string
  children: ReactNode
  actions: ReactNode
  onClose: () => void
  kind?: 'dialog' | 'alertdialog'
  initialFocus?: string
}): JSX.Element | null {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  useModal(ref, open, onClose, initialFocus)
  if (!open) return null
  return createPortal(
    <div
      className="ea-scrim ea-ui"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && kind === 'dialog') onClose()
      }}
    >
      <div ref={ref} role={kind} aria-modal="true" aria-labelledby={id} className="ea-dialog ea-frame">
        <SectionTitle id={id} level={3} draw>
          {title}
        </SectionTitle>
        {children}
        <div className="ea-dialog__actions">{actions}</div>
      </div>
    </div>,
    document.body,
  )
}

/** Sheet: the phone navigation and the filter sheet; slides from the bottom. Close button is the tap alternative to swipe. */
export function Sheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}): JSX.Element | null {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  useModal(ref, open, onClose)
  if (!open) return null
  return createPortal(
    <div
      className="ea-scrim ea-ui"
      data-place="bottom"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className="ea-sheet ea-frame">
        <span className="ea-sheet__handle" aria-hidden="true" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong id={id}>{title}</strong>
          <button type="button" className="ea-btn ea-frame" data-variant="quiet" data-icon-only="" aria-label="Close menu" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export interface CommandItem {
  readonly id: string
  readonly group: 'Resonators' | 'Echoes' | 'Guides' | 'Pages'
  readonly label: string
  readonly icon: IconName
}

/**
 * Command menu (global search): Ctrl/Cmd K or the band trigger. A combobox over grouped results; Enter navigates;
 * Esc closes. Shows recent searches first, "Searching…" after the delay, nothing-matches and an error row.
 */
export function CommandMenu({
  open,
  onClose,
  items,
  status = 'ready',
  onRetry,
  onPick,
}: {
  open: boolean
  onClose: () => void
  items: readonly CommandItem[]
  status?: 'ready' | 'pending' | 'error'
  onRetry?: () => void
  onPick?: (item: CommandItem) => void
}): JSX.Element | null {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  useModal(ref, open, onClose, 'input')
  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return (words.length ? items.filter((item) => words.every((w) => item.label.toLowerCase().includes(w))) : items.slice(0, 4)).slice(0, 9)
  }, [items, query])
  if (!open) return null
  const groups = [...new Set(results.map((r) => r.group))]
  function onKey(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (results.length) setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length)
    } else if (event.key === 'Enter' && results[active]) {
      onPick?.(results[active])
      onClose()
    }
  }
  return createPortal(
    <div
      className="ea-scrim ea-ui"
      data-place="top"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Search" className="ea-dialog ea-frame" data-kind="command">
        <div className="ea-input ea-frame">
          <Icon name="search" size="md" />
          <input
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-activedescendant={results[active] ? `${id}-${active}` : undefined}
            aria-label="Search Resonators, Echoes, guides"
            placeholder="Search Resonators, Echoes, guides"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKey}
          />
          {status === 'pending' ? <Spinner size="sm" label="Searching" /> : null}
        </div>
        <div id={`${id}-list`} role="listbox" aria-label="Results">
          {status === 'error' ? (
            <div className="ea-option-note">
              <Icon name="error" /> Couldn't search right now.
              <button type="button" className="ea-btn ea-frame" data-variant="quiet" onClick={onRetry}>
                Try again
              </button>
            </div>
          ) : status === 'pending' ? (
            <div className="ea-option-note">Searching…</div>
          ) : results.length === 0 ? (
            <div className="ea-option-note">Nothing matches “{query}”. Search the guides instead.</div>
          ) : (
            groups.map((group) => (
              <div key={group} role="group" aria-label={query ? group : 'Recent searches'}>
                <div className="ea-cmd__group" aria-hidden="true">
                  {query ? group : 'Recent searches'}
                </div>
                {results
                  .filter((r) => r.group === group)
                  .map((item) => {
                    const index = results.indexOf(item)
                    return (
                      <div
                        key={item.id}
                        id={`${id}-${index}`}
                        role="option"
                        aria-selected={index === active}
                        className="ea-option"
                        data-active={index === active}
                        onPointerMove={() => setActive(index)}
                        onClick={() => {
                          onPick?.(item)
                          onClose()
                        }}
                      >
                        <Icon name={item.icon} />
                        {item.label}
                      </div>
                    )
                  })}
              </div>
            ))
          )}
        </div>
        <div className="ea-cmd__keys" aria-hidden="true">
          <span>
            <kbd className="ea-kbd">↑</kbd> <kbd className="ea-kbd">↓</kbd> move
          </span>
          <span>
            <kbd className="ea-kbd">Enter</kbd> open
          </span>
          <span>
            <kbd className="ea-kbd">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
