/**
 * Kitty's charts (COMPONENTS.md: Bar list, Line chart, Stacked bar, Ring chart, Chart legend and tooltip). One
 * question each; values always as text beside the marks (the colour is the second encoding); every chart has a table
 * alternative and a keyboard route.
 */
import { useId, useState, type CSSProperties, type JSX } from 'react'
import { Amount, Button } from './core'
import { CATEGORY_ICON } from './data'
import { formatPence, personById, type Category } from './sample'

function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }): JSX.Element {
  return (
    <Button variant="quiet" size="sm" onClick={onToggle} aria-expanded={open}>
      {open ? 'Hide table' : 'Show as table'}
    </Button>
  )
}

function DataTable({ caption, rows }: { caption: string; rows: readonly { label: string; pence: number; share?: string }[] }): JSX.Element {
  return (
    <div className="k-table-wrap">
      <table className="k-table">
        <caption className="k-sr">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col" data-num>
              Amount
            </th>
            {rows.some((r) => r.share) ? (
              <th scope="col" data-num>
                Share
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td data-num>
                <Amount pence={row.pence} />
              </td>
              {row.share ? <td data-num>{row.share}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const pct = (part: number, whole: number): string => `${Math.round((part / Math.max(1, whole)) * 100)}%`

/** Ranking categories by spend: sorted, one green, every bar labelled; each row opens the filtered Activity. */
export function BarList({ caption, rows }: { caption: string; rows: readonly { category: Category; pence: number }[] }): JSX.Element {
  const [table, setTable] = useState(false)
  const sorted = [...rows].sort((a, b) => b.pence - a.pence)
  const max = sorted[0]?.pence ?? 1
  const total = sorted.reduce((sum, r) => sum + r.pence, 0)
  return (
    <figure className="k-chart" style={{ margin: 0 }}>
      <figcaption className="k-card__head">
        <span className="k-chart__caption">{caption}</span>
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      </figcaption>
      {table ? (
        <DataTable caption={caption} rows={sorted.map((r) => ({ label: r.category, pence: r.pence, share: pct(r.pence, total) }))} />
      ) : (
        <ol className="k-bars">
          {sorted.map((row, i) => {
            const CategoryIcon = CATEGORY_ICON[row.category]
            return (
              <li key={row.category}>
                <a className="k-bar-row" href={`#activity?category=${row.category}`} data-top={i === 0 || undefined} title={`${pct(row.pence, total)} of spending`}>
                  <span className="k-bar-row__name">
                    <CategoryIcon className="k-icon" aria-hidden="true" />
                    {row.category}
                  </span>
                  <span className="k-bar-row__track" aria-hidden="true">
                    <span className="k-bar-row__fill" style={{ '--_value': row.pence / max, '--_i': Math.min(i, 9) } as CSSProperties} />
                  </span>
                  <Amount pence={row.pence} />
                  <span className="k-sr">, {pct(row.pence, total)} of spending</span>
                </a>
              </li>
            )
          })}
        </ol>
      )}
    </figure>
  )
}

/** Change over time for one series; keyboard steps through the points; a summary names the change. */
export function LineChart({ caption, points, summary }: { caption: string; points: readonly { label: string; pence: number }[]; summary: string }): JSX.Element {
  const [table, setTable] = useState(false)
  const [focus, setFocus] = useState<number | null>(null)
  const live = useId()
  const W = 600
  const H = 200
  const pad = { l: 48, r: 72, t: 12, b: 24 }
  const values = points.map((p) => p.pence)
  const lo = Math.floor(Math.min(...values) / 20000) * 20000
  const hi = Math.ceil(Math.max(...values) / 20000) * 20000
  const x = (i: number): number => pad.l + (i / Math.max(1, points.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number): number => pad.t + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.pence).toFixed(1)}`).join(' ')
  const ticks = [lo, (lo + hi) / 2, hi]
  const last = points[points.length - 1]
  const active = focus === null ? null : points[focus]
  return (
    <figure className="k-chart" style={{ margin: 0 }}>
      <figcaption className="k-card__head">
        <span className="k-chart__caption">{caption}</span>
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      </figcaption>
      {table ? (
        <DataTable caption={caption} rows={points.map((p) => ({ label: p.label, pence: p.pence }))} />
      ) : (
        <div
          className="k-linechart"
          role="img"
          aria-label={summary}
          tabIndex={0}
          aria-describedby={live}
          style={{ position: 'relative' }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') setFocus((f) => Math.min(points.length - 1, (f ?? -1) + 1))
            else if (event.key === 'ArrowLeft') setFocus((f) => Math.max(0, (f ?? points.length) - 1))
            else if (event.key === 'Home') setFocus(0)
            else if (event.key === 'End') setFocus(points.length - 1)
            else return
            event.preventDefault()
          }}
          onBlur={() => setFocus(null)}
          onPointerLeave={() => setFocus(null)}
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect()
            const rel = ((event.clientX - box.left) / box.width) * W
            const i = Math.round(((rel - pad.l) / (W - pad.l - pad.r)) * (points.length - 1))
            setFocus(Math.max(0, Math.min(points.length - 1, i)))
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {ticks.map((t) => (
              <g key={t}>
                <line className="k-linechart__grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
                <text className="k-linechart__axis" x={pad.l - 8} y={y(t) + 4} textAnchor="end">
                  £{(t / 100000).toFixed(1)}k
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              i % 2 === 0 ? (
                <text key={p.label} className="k-linechart__axis" x={x(i)} y={H - 4} textAnchor="middle">
                  {p.label}
                </text>
              ) : null,
            )}
            <path className="k-linechart__line" d={path} pathLength={1} style={{ strokeDasharray: 1, animation: 'k-trace var(--dur-3xl) var(--ease-enter) both' }} />
            {focus !== null ? (
              <>
                <line className="k-linechart__cross" x1={x(focus)} x2={x(focus)} y1={pad.t} y2={H - pad.b} />
                <circle className="k-linechart__dot" cx={x(focus)} cy={y(points[focus].pence)} r={4} />
              </>
            ) : null}
            <text className="k-linechart__end" x={x(points.length - 1) + 8} y={y(last.pence) + 4}>
              {formatPence(last.pence)}
            </text>
          </svg>
          {active && focus !== null ? (
            <span className="k-chart-tooltip" style={{ left: `${(x(focus) / W) * 100}%`, top: `${(y(active.pence) / H) * 100}%` }}>
              {active.label}, {formatPence(active.pence)}
            </span>
          ) : null}
          <span id={live} className="k-sr" aria-live="polite">
            {active ? `${active.label}, ${formatPence(active.pence)}` : 'Use the left and right arrow keys to read each point.'}
          </span>
        </div>
      )}
    </figure>
  )
}

/** Who spent what: one 100 % bar in person colours, a name and amount beside every segment. */
export function StackedBar({ caption, rows }: { caption: string; rows: readonly { person: string; pence: number }[] }): JSX.Element {
  const [table, setTable] = useState(false)
  const total = rows.reduce((sum, r) => sum + r.pence, 0)
  return (
    <figure className="k-chart" style={{ margin: 0 }}>
      <figcaption className="k-card__head">
        <span className="k-chart__caption">{caption}</span>
        <TableToggle open={table} onToggle={() => setTable((t) => !t)} />
      </figcaption>
      {table ? (
        <DataTable caption={caption} rows={rows.map((r) => ({ label: personById(r.person).name, pence: r.pence, share: pct(r.pence, total) }))} />
      ) : (
        <>
          <div className="k-stackbar">
            {rows.map((row) => {
              const person = personById(row.person)
              return (
                <button
                  key={row.person}
                  type="button"
                  className="k-stack-seg"
                  data-colour={person.colour}
                  style={{ flexGrow: row.pence }}
                  aria-label={`${person.name}, ${formatPence(row.pence)}, ${pct(row.pence, total)}. Show ${person.name}’s activity`}
                  title={`${person.name}, ${formatPence(row.pence)} (${pct(row.pence, total)})`}
                />
              )
            })}
          </div>
          <ChartLegend items={rows.map((r) => ({ id: r.person, label: personById(r.person).name, colour: personById(r.person).colour, value: `${formatPence(r.pence)} · ${pct(r.pence, total)}` }))} />
        </>
      )}
    </figure>
  )
}

/** A share of five parts or fewer, read at a glance. Here: saved of this month's allowance. */
export function RingChart({ part, whole, name, partLabel, restLabel }: { part: number; whole: number; name: string; partLabel: string; restLabel: string }): JSX.Element {
  const r = 40
  const c = 2 * Math.PI * r
  const share = Math.min(1, part / Math.max(1, whole))
  return (
    <div className="k-ring" data-complete={share >= 1 || undefined}>
      <svg viewBox="0 0 96 96" role="img" aria-label={name}>
        <circle className="k-ring__track" cx="48" cy="48" r={r} />
        <circle className="k-ring__value" cx="48" cy="48" r={r} strokeDasharray={`${(share * c).toFixed(1)} ${c.toFixed(1)}`} />
      </svg>
      <div className="k-stack" style={{ gap: 'var(--space-1)' }}>
        <Amount pence={part} size="lg" />
        <span className="k-muted" style={{ fontSize: 'var(--step--1)' }}>
          {partLabel} · {restLabel}
        </span>
      </div>
    </div>
  )
}

/** Direct labels first; a legend only where labels do not fit. Items can toggle a series (never the last one). */
export function ChartLegend({ items, toggleable = false }: { items: readonly { id: string; label: string; colour?: 1 | 2 | 3 | 4 | 5; value?: string; line?: boolean }[]; toggleable?: boolean }): JSX.Element {
  const [hidden, setHidden] = useState<readonly string[]>([])
  return (
    <ul className="k-legend">
      {items.map((item) => {
        const swatch = <span className="k-swatch" data-colour={item.colour} data-shape={item.line ? 'line' : undefined} aria-hidden="true" />
        const on = !hidden.includes(item.id)
        return (
          <li key={item.id}>
            {toggleable ? (
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (on && items.length - hidden.length <= 1) return
                  setHidden((h) => (on ? [...h, item.id] : h.filter((x) => x !== item.id)))
                }}
              >
                {swatch}
                {item.label}
                {item.value ? <span className="k-muted k-num">{item.value}</span> : null}
              </button>
            ) : (
              <>
                {swatch}
                {item.label}
                {item.value ? <span className="k-muted k-num">{item.value}</span> : null}
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
