import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type JSX } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Unavailable with the other choices: stays reachable and says why. */
  disabledReason?: string
}

export interface SegmentedProps<T extends string> {
  legend: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  hint?: string
}

/**
 * One choice from two to four visible options that change the cake at once (COMPONENTS.md §Segmented control): a
 * radio group. The selected surface slides between options over `--dur-select` (MOTION-SYSTEM.md: tab switch); arrow
 * keys move and select; keyboard moves are instant under reduced motion through the token.
 */
export function Segmented<T extends string>({ legend, options, value, onChange, hint }: SegmentedProps<T>): JSX.Element {
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  // The thumb takes the selected option's measured box: labels differ in length, so the columns are not equal.
  const [thumb, setThumb] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = refs.current[index]
    if (!el) return
    const measure = (): void => {
      const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
      // same box, same state: never re-render for nothing (a layout effect that always sets state loops)
      setThumb((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el.parentElement ?? el)
    return () => ro.disconnect()
  }, [index, options.length])
  const choose = (i: number): void => {
    const option = options[i]
    if (!option || option.disabledReason) return
    onChange(option.value)
    refs.current[i]?.focus()
  }
  const move = (from: number, dir: 1 | -1): void => {
    for (let step = 1; step <= options.length; step++) {
      const i = (from + dir * step + options.length) % options.length
      if (!options[i].disabledReason) {
        choose(i)
        return
      }
    }
  }
  return (
    <div className="ms-field">
      <span id={`${id}-legend`} className="ms-field__label">
        {legend}
      </span>
      {hint ? (
        <span id={`${id}-hint`} className="ms-field__hint">
          {hint}
        </span>
      ) : null}
      <div
        className="ms-seg"
        role="radiogroup"
        aria-labelledby={`${id}-legend`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        style={{ '--_n': options.length } as CSSProperties}
      >
        <span
          className="ms-seg__thumb"
          aria-hidden="true"
          style={thumb ? { inlineSize: thumb.w, blockSize: thumb.h, transform: `translate(${thumb.x}px, ${thumb.y}px)` } : { opacity: 0 }}
        />
        {options.map((option, i) => (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            className="ms-seg__opt"
            aria-checked={option.value === value}
            aria-disabled={option.disabledReason ? true : undefined}
            aria-description={option.disabledReason}
            tabIndex={option.value === value ? 0 : -1}
            onClick={() => choose(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                move(i, 1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                move(i, -1)
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
