import { cloneElement, useId, useRef, useState, type JSX, type ReactElement, type ReactNode } from 'react'
import { useFloating } from './float'
import './ui.css'

export type Tier = 'common' | 'uncommon' | 'rare' | 'epic'

/** The first line of an item tooltip: the name, in its tier colour. The tier is also written, so colour is not alone. */
export function TipName({ children, tier = 'common' }: { children: ReactNode; tier?: Tier }): JSX.Element {
  return (
    <span className="bf-tip__name" data-tier={tier === 'common' ? undefined : tier}>
      {children}
    </span>
  )
}

export function TipLine({ children, tone }: { children: ReactNode; tone?: 'good' | 'info' | 'ink' }): JSX.Element {
  return (
    <span className="bf-tip__line" data-tone={tone}>
      {children}
    </span>
  )
}

export function TipGap(): JSX.Element {
  return <span className="bf-tip__gap" />
}

export interface TooltipProps {
  readonly content: ReactNode
  /** exactly one element: it receives `aria-describedby` and is the thing the tooltip describes */
  readonly children: ReactElement<{ 'aria-describedby'?: string }>
  readonly side?: 'top' | 'bottom'
  readonly align?: 'center' | 'start' | 'end'
}

/**
 * The dark purple tooltip frame. It opens on hover and on keyboard focus with no delay (the game has none), closes on
 * Escape and on leaving, and never holds anything the person must read: it repeats, it does not replace.
 */
export function Tooltip({ content, children, side = 'top', align = 'center' }: TooltipProps): JSX.Element {
  const id = useId()
  const wrap = useRef<HTMLSpanElement>(null)
  const layer = useRef<HTMLSpanElement>(null)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  // Escape hides it until the pointer or focus has left and come back; the key of the last leave resets it
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const [visit, setVisit] = useState(0)
  const open = (hover || focus) && dismissedAt !== visit
  useFloating(open, wrap, layer, { side, align })
  const enter = (set: (v: boolean) => void): void => {
    if (!hover && !focus) setVisit((v) => v + 1)
    set(true)
  }
  return (
    <span
      ref={wrap}
      className="bf-tipwrap"
      onPointerEnter={(e) => e.pointerType !== 'touch' && enter(setHover)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => enter(setFocus)}
      onBlur={() => setFocus(false)}
      onKeyDown={(e) => e.key === 'Escape' && setDismissedAt(visit)}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span ref={layer} popover="manual" role="tooltip" id={id} className="bf-tip">
        {content}
      </span>
    </span>
  )
}
