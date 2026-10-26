import { useId, useState, type JSX, type ReactNode } from 'react'
import { ChevronIcon } from '../feedback/icons'

export interface AccordionItem {
  id: string
  question: string
  answer: ReactNode
}

/** Wraps each match of `query` in a <mark>, case-insensitive. */
export function highlight(text: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return text
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return parts.map((part, i) => (part.toLowerCase() === q.toLowerCase() ? <mark key={i}>{part}</mark> : part))
}

/**
 * The FAQ (COMPONENTS.md §Accordion): a heading with a button per question, several open at once, Enter or Space
 * toggles, focus stays on the button. The chevron turns over `--dur-disclosure`; the panel's content fades in, its
 * height is not animated.
 */
export function Accordion({ items, query = '', id: listId, headingLevel = 3 }: { items: readonly AccordionItem[]; query?: string; id?: string; headingLevel?: 3 | 4 }): JSX.Element {
  const Heading = headingLevel === 4 ? 'h4' : 'h3'
  const base = useId()
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set())
  return (
    <div className="ms-acc" id={listId}>
      {items.map((item) => {
        const expanded = open.has(item.id)
        const panel = `${base}-${item.id}`
        return (
          <div key={item.id} className="ms-acc__item">
            <Heading>
              <button
                type="button"
                className="ms-acc__btn"
                aria-expanded={expanded}
                aria-controls={panel}
                onClick={() =>
                  setOpen((s) => {
                    const next = new Set(s)
                    if (next.has(item.id)) next.delete(item.id)
                    else next.add(item.id)
                    return next
                  })
                }
              >
                <span>{highlight(item.question, query)}</span>
                <ChevronIcon />
              </button>
            </Heading>
            <div id={panel} className="ms-acc__panel" hidden={!expanded} data-open={expanded || undefined}>
              {item.answer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
