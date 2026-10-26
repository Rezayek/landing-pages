import { useId, useState, type CSSProperties, type JSX } from 'react'
import { Skeleton } from '../feedback'
import { Table } from './Data'

const vars = (values: Record<`--${string}`, string | number>): CSSProperties => values as unknown as CSSProperties

export interface BarDatum {
  readonly label: string
  readonly value: number
  readonly target?: number
  readonly display: string
}

/**
 * Bar list (sorted or with targets): current vs. target stats, substat priority, tier usage ranking. Square bars in
 * --chart-1, a target tick in ink, direct labels, a table alternative. Widths change over --dur-lg.
 */
export function BarList({
  title,
  data,
  max,
  state = 'ready',
}: {
  title: string
  data: readonly BarDatum[]
  max: number
  state?: 'ready' | 'loading' | 'empty'
}): JSX.Element {
  const [asTable, setAsTable] = useState(false)
  const summary = data.map((d) => `${d.label} ${d.display}${d.target !== undefined ? ` of a ${d.target} target` : ''}`).join('; ')
  return (
    <figure className="ea-chart" style={{ margin: 0 }}>
      <figcaption style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', fontSize: 'var(--step--1)', color: 'var(--muted)' }}>
        <span>{title}</span>
        {state === 'ready' ? (
          <button type="button" className="ea-link" data-standalone="" style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit' }} onClick={() => setAsTable((t) => !t)}>
            {asTable ? 'Show as chart' : 'Show as table'}
          </button>
        ) : null}
      </figcaption>
      {state === 'loading' ? (
        <div aria-busy="true" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rect" height="var(--space-3)" width={`${90 - i * 18}%`} />
          ))}
        </div>
      ) : state === 'empty' ? (
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 'var(--step--1)' }}>No data for this version yet.</p>
      ) : asTable ? (
        <Table
          caption={title}
          rows={data}
          rowKey={(d) => d.label}
          columns={[
            { id: 'stat', label: 'Stat', cell: (d) => d.label },
            { id: 'value', label: 'Value', numeric: true, cell: (d) => d.display },
            { id: 'target', label: 'Target', numeric: true, cell: (d) => (d.target === undefined ? '—' : String(d.target)) },
          ]}
        />
      ) : (
        <ul className="ea-bars" aria-label={summary}>
          {data.map((d) => (
            <li key={d.label}>
              <span>{d.label}</span>
              <span className="ea-bars__track">
                <span className="ea-bars__fill" style={vars({ '--v': Math.min(1, d.value / max) })} />
                {d.target !== undefined ? <span className="ea-bars__target" style={vars({ '--t': Math.min(1, d.target / max) })} /> : null}
              </span>
              <span className="ea-bars__value">{d.display}</span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  )
}

/**
 * Line chart: usage rate across game versions. One data hue plus one dashed comparison, direct end labels, a few
 * faint gridlines, focusable points (arrows move, the value is read), a gap for missing data.
 */
export function LineChart({
  title,
  labels,
  series,
}: {
  title: string
  labels: readonly string[]
  series: readonly { name: string; values: readonly (number | null)[] }[]
}): JSX.Element {
  const id = useId()
  const [focus, setFocus] = useState<number | null>(null)
  const W = 320
  const H = 140
  const pad = 24
  const x = (i: number): number => pad + (i * (W - pad * 2 - 84)) / (labels.length - 1)
  const y = (v: number): number => H - pad - (v / 100) * (H - pad * 2)
  const pathOf = (values: readonly (number | null)[]): string =>
    values.reduce((acc, v, i) => (v === null ? acc : `${acc}${acc && values[i - 1] !== null ? 'L' : 'M'}${x(i)} ${y(v)}`), '')
  const main = series[0]
  return (
    <figure className="ea-chart ea-line" style={{ margin: 0 }}>
      <figcaption id={id} style={{ fontSize: 'var(--step--1)', color: 'var(--muted)' }}>
        {title}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-labelledby={id}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line className="ea-line__grid" x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} />
            <text className="ea-line__axis" x={2} y={y(g) + 4}>
              {g}%
            </text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l} className="ea-line__axis" x={x(i)} y={H - 4} textAnchor="middle">
            {l}
          </text>
        ))}
        {series.map((s, si) => (
          <path key={s.name} className="ea-line__series" data-series={si === 0 ? undefined : '2'} d={pathOf(s.values)} />
        ))}
        {main.values.map((v, i) =>
          v === null ? null : (
            <circle
              key={i}
              className="ea-line__point"
              cx={x(i)}
              cy={y(v)}
              r={focus === i ? 5 : 3.5}
              tabIndex={0}
              role="img"
              aria-label={`${main.name}, version ${labels[i]}: ${v}%`}
              onFocus={() => setFocus(i)}
              onBlur={() => setFocus(null)}
            />
          ),
        )}
        {series.map((s, si) => {
          const lastIndex = s.values.length - 1 - [...s.values].reverse().findIndex((v) => v !== null)
          const last = s.values[lastIndex]
          return last === null || last === undefined ? null : (
            <text key={s.name} className="ea-line__label" x={x(lastIndex) + 6} y={y(last) + (si ? 12 : -6)}>
              {s.name} {last}%
            </text>
          )
        })}
      </svg>
    </figure>
  )
}

/** Ring: a share of five parts or fewer (Echo set completion), with the count beside it. */
export function Ring({ value, total, label }: { value: number; total: number; label: string }): JSX.Element {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <div className="ea-ring">
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle className="ea-ring__track" cx="36" cy="36" r={r} />
        <circle className="ea-ring__value" cx="36" cy="36" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - value / total)} />
      </svg>
      <span>
        <strong data-numeric="">
          {value} of {total}
        </strong>
        <br />
        <span style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>{label}</span>
      </span>
    </div>
  )
}
