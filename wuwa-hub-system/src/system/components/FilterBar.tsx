import type { JSX } from 'react'
import { Spinner } from '../feedback'
import { Button } from './Button'
import { Chip, ToggleChip } from './Data'
import { Select } from './Select'
import { useLandmarkLabel } from './scope'
import { ELEMENTS, ELEMENT_LABEL, Sigil, type Element } from './icons'
import { WEAPONS, type Rarity, type Weapon } from './sample'

export interface Filters {
  readonly elements: readonly Element[]
  readonly weapons: readonly Weapon[]
  readonly rarities: readonly Rarity[]
}

export const NO_FILTERS: Filters = { elements: [], weapons: [], rarities: [] }

export const filterCount = (f: Filters): number => f.elements.length + f.weapons.length + f.rarities.length

/** The applied filters in words, for the no-results state ("Glacio, Pistols and 4★"). */
export function describeFilters(f: Filters): string[] {
  return [...f.elements.map((e) => ELEMENT_LABEL[e]), ...f.weapons, ...f.rarities.map((r) => `${r}★`)]
}

/**
 * Filter bar for the Resonator database: six element toggles (sigil + name), a weapon multi-select, rarity toggles,
 * the live results count (with the waveform while results update) and Clear filters. Applies at once; the count is
 * a polite live region. On phones the same controls sit in a sheet (FilterSheet in the scenario).
 */
export function FilterBar({
  value,
  onChange,
  count,
  pending = false,
  noun = 'Resonators',
}: {
  value: Filters
  onChange: (next: Filters) => void
  count: number | null
  pending?: boolean
  noun?: string
}): JSX.Element {
  const toggle = <T,>(list: readonly T[], item: T): T[] => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  const any = filterCount(value) > 0
  const label = useLandmarkLabel(`Filter ${noun}`)
  return (
    <div role="search" aria-label={label} style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <div className="ea-filters">
        <fieldset className="ea-filters__group">
          <legend>Element</legend>
          <div className="ea-filters__chips">
            {ELEMENTS.map((element) => (
              <ToggleChip key={element} pressed={value.elements.includes(element)} onToggle={() => onChange({ ...value, elements: toggle(value.elements, element) })}>
                <Sigil element={element} />
                {ELEMENT_LABEL[element]}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
        <div style={{ inlineSize: 'min(12rem, 100%)' }}>
          <Select label="Weapon" options={WEAPONS.map((w) => ({ id: w, label: w }))} value={value.weapons} onChange={(weapons) => onChange({ ...value, weapons })} multiple placeholder="Any weapon" />
        </div>
        <fieldset className="ea-filters__group">
          <legend>Rarity</legend>
          <div className="ea-filters__chips">
            {([5, 4] as const).map((r) => (
              <ToggleChip key={r} pressed={value.rarities.includes(r)} onToggle={() => onChange({ ...value, rarities: toggle(value.rarities, r) })}>
                {r}★
              </ToggleChip>
            ))}
          </div>
        </fieldset>
        <span className="ea-filters__count">
          {pending ? <Spinner size="sm" /> : null}
          {/* while results update the old count is not shown (it is no longer true); the live text says only counts */}
          <span className="ea-filters__num" role="status" aria-live="polite">
            {pending || count === null ? '' : `${count} ${count === 1 ? noun.replace(/s$/, '') : noun}`}
          </span>
          {pending ? (
            <span className="ea-filters__num" aria-hidden="true">
              Updating…
            </span>
          ) : null}
          {any ? (
            <Button variant="quiet" onClick={() => onChange(NO_FILTERS)}>
              Clear filters
            </Button>
          ) : null}
        </span>
      </div>
      {any ? (
        <ul className="ea-applied" aria-label="Applied filters">
          {value.elements.map((e) => (
            <li key={e}>
              <Chip removeLabel={`Remove filter: ${ELEMENT_LABEL[e]}`} onRemove={() => onChange({ ...value, elements: value.elements.filter((x) => x !== e) })}>
                {ELEMENT_LABEL[e]}
              </Chip>
            </li>
          ))}
          {value.weapons.map((w) => (
            <li key={w}>
              <Chip removeLabel={`Remove filter: ${w}`} onRemove={() => onChange({ ...value, weapons: value.weapons.filter((x) => x !== w) })}>
                {w}
              </Chip>
            </li>
          ))}
          {value.rarities.map((r) => (
            <li key={r}>
              <Chip removeLabel={`Remove filter: ${r} star`} onRemove={() => onChange({ ...value, rarities: value.rarities.filter((x) => x !== r) })}>
                {r}★
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
