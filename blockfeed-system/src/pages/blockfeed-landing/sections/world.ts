/**
 * The page's small shared state: the Y-level descent (which section is current) and /tp teleports to the hero plot.
 * Sections mark themselves with data-y and data-y-label; the HUD reads the current one. A coordinate anywhere on the
 * page calls teleportTo(buildId); the hero listens.
 */
import { useEffect, useState } from 'react'

export const TP_EVENT = 'bl:tp'

export function teleportTo(buildId: string): void {
  window.dispatchEvent(new CustomEvent(TP_EVENT, { detail: { buildId } }))
}

export interface Level {
  readonly y: number
  readonly label: string
}

const SURFACE: Level = { y: 64, label: 'surface' }

/** The section nearest the top of the viewport that carries data-y. */
export function useLevel(): Level {
  const [level, setLevel] = useState<Level>(SURFACE)
  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>('[data-y]')]
    if (!nodes.length) return
    const seen = new Map<Element, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target, e.isIntersecting)
        const current = nodes.filter((n) => seen.get(n)).at(-1) ?? nodes[0]
        setLevel({ y: Number(current.dataset.y), label: current.dataset.yLabel ?? '' })
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [])
  return level
}
