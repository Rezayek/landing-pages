import { useLayoutEffect, type RefObject } from 'react'

export interface FloatPlacement {
  readonly side: 'top' | 'bottom'
  readonly align: 'center' | 'start' | 'end'
}

/**
 * Puts `layer` in the browser's top layer (the Popover API, `popover="manual"`) and places it against `anchor`.
 *
 * A panel is clipped to its notched outline, so a tooltip or a menu that reaches past the panel's edge would be cut off.
 * The top layer is not clipped by any ancestor and sits above every z-index, inside a modal dialog too. Placement is
 * whole device pixels, flips to the other side when the first does not fit, and is kept inside the window.
 */
export function useFloating(open: boolean, anchor: RefObject<HTMLElement | null>, layer: RefObject<HTMLElement | null>, { side, align }: FloatPlacement): void {
  useLayoutEffect(() => {
    const el = layer.current
    const ref = anchor.current
    if (!open || !el || !ref) return
    if (!el.matches(':popover-open')) el.showPopover()
    const unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 2
    const gap = unit * 3
    const margin = unit * 2
    const place = (): void => {
      const a = ref.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      let top = side === 'top' ? a.top - b.height - gap : a.bottom + gap
      if (side === 'top' && top < margin) top = a.bottom + gap
      else if (side === 'bottom' && top + b.height > window.innerHeight - margin) top = a.top - b.height - gap
      let left = align === 'start' ? a.left : align === 'end' ? a.right - b.width : a.left + (a.width - b.width) / 2
      left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - b.width - margin))
      el.style.setProperty('top', `${Math.round(top)}px`)
      el.style.setProperty('left', `${Math.round(left)}px`)
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
      try {
        if (el.matches(':popover-open')) el.hidePopover()
      } catch {
        // the element left the document first: nothing to hide
      }
    }
  }, [open, anchor, layer, side, align])
}
