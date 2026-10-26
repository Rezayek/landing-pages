/**
 * Combobox with grouped suggestions and the command menu that holds it (COMPONENTS.md: Combobox, Command menu).
 * WAI-ARIA combobox with a listbox popup: arrows move, Enter opens, Esc closes then clears; nothing is auto-selected.
 */
import { useEffect, useId, useRef, useState, type JSX } from 'react'
import { Skeleton, announce } from '../feedback'
import { SearchIcon } from '../feedback/icons'
import { simulate, isAbort, type LatencyId } from '../latency'
import { Dialog } from './navigation'
import { GAMES, PriceReadout, type Game } from './store'
import './vc.css'

export function Combobox({ latency, label = 'Search games and battle passes', onPick }: { latency: LatencyId; label?: string; onPick?: (game: Game) => void }): JSX.Element {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [items, setItems] = useState<readonly Game[]>([])
  const [active, setActive] = useState(-1)
  const id = useId()
  const listId = `${id}-list`
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setOpen(false)
      return
    }
    const t = window.setTimeout(async () => {
      controller.current?.abort()
      const own = new AbortController()
      controller.current = own
      setBusy(true)
      setError(false)
      setOpen(true)
      try {
        const found = await simulate(latency, GAMES.filter((g) => g.title.toLowerCase().includes(query.trim().toLowerCase())), own.signal)
        setItems(found)
        setActive(-1)
        announce(found.length ? `${found.length} suggestion${found.length === 1 ? '' : 's'}` : 'No matches')
      } catch (e) {
        if (!isAbort(e)) setError(true)
      } finally {
        if (controller.current === own) setBusy(false)
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [query, latency])

  useEffect(() => () => controller.current?.abort(), [])

  const pick = (game: Game) => {
    setQuery(game.title)
    setOpen(false)
    onPick?.(game)
    announce(`Opening ${game.title}`)
  }

  return (
    <div className="vc-anchor" style={{ display: 'block' }}>
      <label htmlFor={id} className="vc-sr">
        {label}
      </label>
      <div className="vc-input vc-cut">
        <span className="vc-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Search games"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && open) {
              event.preventDefault()
              setActive((a) => Math.min(items.length - 1, a + 1))
            } else if (event.key === 'ArrowUp' && open) {
              event.preventDefault()
              setActive((a) => Math.max(-1, a - 1))
            } else if (event.key === 'Enter' && active >= 0) {
              event.preventDefault()
              pick(items[active])
            } else if (event.key === 'Escape') {
              if (open) setOpen(false)
              else setQuery('')
            }
          }}
        />
      </div>
      {open ? (
        <div className="vc-menu vc-cut vc-cut--card" style={{ insetInlineEnd: 0, maxInlineSize: 'none' }}>
          <ul id={listId} role="listbox" aria-label="Suggestions" aria-busy={busy || undefined} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {busy && !items.length ? (
              <li aria-hidden="true" className="vc-menu__item">
                <Skeleton width="70%" />
              </li>
            ) : null}
            {!busy && error ? <li className="vc-menu__item vc-muted">Suggestions didn't load. Press Enter to search.</li> : null}
            {!busy && !error && !items.length ? <li className="vc-menu__item vc-muted">No matches. Search all for “{query}”.</li> : null}
            {items.map((game, i) => (
              <li
                key={game.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className="vc-menu__item"
                style={{ minBlockSize: 'var(--row-h-media)', opacity: busy ? 0.7 : 1, boxShadow: i === active ? 'inset 0 0 0 2px var(--focus)' : undefined, background: i === active ? 'var(--hover-bg)' : undefined }}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => pick(game)}
              >
                <span style={{ flex: 1 }}>{game.title}</span>
                <PriceReadout size="line" price={game.price} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/** The command menu: "/" or Ctrl+K opens it; focus goes into the search and back to the opener on close. */
export function CommandMenu({ latency, open, onClose }: { latency: LatencyId; open: boolean; onClose: () => void }): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} title="Search VOLTCART" initialFocus="input" headingLevel={3}>
      <Combobox latency={latency} onPick={onClose} />
      <p className="vc-muted">Recent searches: neon, racing, battle pass</p>
    </Dialog>
  )
}
