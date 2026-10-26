import { useRef, type JSX } from 'react'
import { CheckIcon } from '../feedback/icons'
import { play } from '../vfx'

export type Petal = 'classic' | 'modern' | 'floral' | 'naked' | 'sculptural' | 'flavour'

export interface ChipOption<T extends string> {
  value: T
  label: string
  /** The style's petal dust; neutral chips leave it out. */
  petal?: Petal
  count?: number
}

interface BaseProps<T extends string> {
  legend: string
  options: readonly ChipOption<T>[]
  /** Hide the legend visually (it stays for assistive technology). */
  hideLegend?: boolean
}

export type ChoiceChipsProps<T extends string> = BaseProps<T> &
  (
    | { multiple?: false; value: T | null; onChange: (value: T | null) => void }
    | { multiple: true; value: readonly T[]; onChange: (value: T[]) => void }
  )

/**
 * Pearl chips in their style's petal dust (COMPONENTS.md §Choice chips): a radio group (single) or a group of
 * checkboxes (multiple). Choosing one lets its petal dust settle in ('dust') and pipes its tick ('pipe'),
 * MOTION-SYSTEM.md: selection and toggle. Arrow keys move in a single group; Space toggles in a multiple group.
 */
export function ChoiceChips<T extends string>(props: ChoiceChipsProps<T>): JSX.Element {
  const { legend, options, hideLegend } = props
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const isOn = (value: T): boolean => (props.multiple ? props.value.includes(value) : props.value === value)
  const toggle = (i: number): void => {
    const option = options[i]
    if (props.multiple) {
      const next = isOn(option.value) ? props.value.filter((v) => v !== option.value) : [...props.value, option.value]
      props.onChange(next)
    } else {
      props.onChange(isOn(option.value) ? null : option.value)
    }
    const el = refs.current[i]
    if (el && !isOn(option.value)) void play(el, 'dust')
  }
  const focusAt = (i: number): void => refs.current[(i + options.length) % options.length]?.focus()
  const firstOn = options.findIndex((o) => isOn(o.value))
  return (
    <fieldset className="ms-chips" role={props.multiple ? 'group' : 'radiogroup'}>
      <legend className={hideLegend ? 'ms-sr' : undefined}>{legend}</legend>
      {options.map((option, i) => {
        const on = isOn(option.value)
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role={props.multiple ? 'checkbox' : 'radio'}
            aria-checked={on}
            className="ms-chip"
            data-petal={option.petal}
            tabIndex={props.multiple || on || (firstOn < 0 && i === 0) ? 0 : -1}
            onClick={() => toggle(i)}
            onKeyDown={(e) => {
              if (props.multiple) return
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                focusAt(i + 1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                focusAt(i - 1)
              }
            }}
          >
            {on ? (
              <span data-vfx-play="pipe" style={{ display: 'inline-flex' }}>
                <CheckIcon />
              </span>
            ) : null}
            {option.label}
            {option.count !== undefined ? <span className="ms-chip__count">{option.count}</span> : null}
          </button>
        )
      })}
    </fieldset>
  )
}
