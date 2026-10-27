/**
 * Page keys (COMPONENTS.md, Page keys): the row of keys a synth uses to switch its control banks (Main, Voice, FX,
 * Loop), each with an LED that lights on the open bank. It is the WAI-ARIA tabs pattern: the keys are tabs, the page
 * renders one `tabpanel` per key with the ids `pageKeyIds` gives it. Arrows move between keys and open the bank (a
 * bank change is instant and harmless), Home and End jump to the ends.
 */
import { useRef, type JSX, type KeyboardEvent } from 'react'
import { Led } from './display'

export interface PageKey {
  readonly id: string
  readonly label: string
}

/** The tab and panel ids for one key, so the page's panels and the keys point at each other. */
export function pageKeyIds(base: string, id: string): { tab: string; panel: string } {
  return { tab: `${base}-key-${id}`, panel: `${base}-bank-${id}` }
}

export interface PageKeysProps {
  keys: readonly PageKey[]
  value: string
  onChange: (id: string) => void
  /** the prefix for the tab and panel ids (pageKeyIds) */
  idBase: string
  /** the group's name: "Control banks" */
  label: string
}

export function PageKeys({ keys, value, onChange, idBase, label }: PageKeysProps): JSX.Element {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    const at = keys.findIndex((k) => k.id === value)
    const to =
      e.key === 'ArrowRight' ? (at + 1) % keys.length : e.key === 'ArrowLeft' ? (at - 1 + keys.length) % keys.length : e.key === 'Home' ? 0 : e.key === 'End' ? keys.length - 1 : -1
    if (to < 0) return
    e.preventDefault()
    onChange(keys[to].id)
    refs.current[to]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className="pi-pagekeys" onKeyDown={onKeyDown}>
      {keys.map((k, i) => {
        const on = k.id === value
        const ids = pageKeyIds(idBase, k.id)
        return (
          <button
            key={k.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={ids.tab}
            aria-controls={ids.panel}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className="pi-quiet pi-pagekey"
            onClick={() => onChange(k.id)}
          >
            <Led state={on ? 'on' : 'off'} />
            {k.label}
          </button>
        )
      })}
    </div>
  )
}
