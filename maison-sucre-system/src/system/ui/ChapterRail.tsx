import type { JSX } from 'react'

export interface ChapterStep {
  href: string
  label: string
}

export interface ChapterRailProps {
  steps: readonly ChapterStep[]
  /** Index of the lit step. */
  current: number
  label?: string
}

/**
 * The chapter rail (COMPONENTS.md §Chapter rail, 0.4.0): a short numbered list of a scroll story's chapters on the
 * ganache band, the current one lit, each a link that jumps to its chapter, so the story has a keyboard and
 * single-pointer path. Gilded numerals; on a phone only the lit step keeps its name in view (the others show their
 * numeral, their names stay in the link text), so the rail fits the screen and never scrolls sideways.
 */
export function ChapterRail({ steps, current, label = 'Chapters' }: ChapterRailProps): JSX.Element {
  return (
    <nav className="ms-rail" aria-label={label}>
      <ol>
        {steps.map((s, i) => (
          <li key={s.href}>
            <a href={s.href} aria-current={i === current ? 'step' : undefined}>
              <span className="ms-numeral" aria-hidden="true">
                {i + 1}
              </span>
              <span className="ms-rail__label">{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
