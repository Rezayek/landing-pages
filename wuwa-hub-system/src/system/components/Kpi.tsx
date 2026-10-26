import { useEffect, useRef, useState, type JSX } from 'react'
import { Delta } from './Data'

/**
 * KPI tile: one key stat of the current build. Label above (sentence case), value at --step-3 tabular, the change
 * against the target with its window ("vs. target 70%"). When the delta changes, its underline draws (ea-draw).
 * The answer tile (the stat the build is short of) is 1.3x and carries the gold edge.
 */
export function KpiTile({
  label,
  value,
  unit = '%',
  target,
  answer = false,
}: {
  label: string
  value: number | null
  unit?: string
  target?: number
  answer?: boolean
}): JSX.Element {
  const [drawKey, setDrawKey] = useState(0)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setDrawKey((k) => k + 1)
  }, [value])
  const diff = value !== null && target !== undefined ? Math.round((value - target) * 10) / 10 : null
  return (
    <div className="ea-kpi ea-frame" data-answer={answer || undefined} role="group" aria-label={label}>
      <span className="ea-kpi__label">{label}</span>
      <span className="ea-kpi__value" data-numeric="">
        {value === null ? '—' : `${value.toFixed(1)}${unit}`}
      </span>
      {value === null ? (
        <span className="ea-kpi__label">Add an Echo to see it</span>
      ) : diff !== null ? (
        <span className="ea-kpi__delta-line">
          <Delta value={diff} better={diff >= 0} unit={unit} />
          <span className="ea-kpi__label">&nbsp;vs. target {target}{unit}</span>
          {drawKey > 0 ? <i key={drawKey} className="ea-draw" aria-hidden="true" /> : null}
        </span>
      ) : null}
    </div>
  )
}
