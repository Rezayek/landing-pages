import type { CSSProperties, JSX, ReactNode } from 'react'
import { fullBodyOf, portraitOf, RESONATORS, type Resonator } from './sample'
import { ELEMENT_LABEL, Icon, Sigil, type Element } from './icons'

const vars = (values: Record<`--${string}`, string | number>): CSSProperties => values as unknown as CSSProperties

/** Chevron tag: a category label between two drawn chevrons. Static, or a toggle (aria-pressed) in filters. */
export function ChevronTag({ children, tone }: { children: ReactNode; tone?: 'accent' }): JSX.Element {
  return (
    <span className="ea-tag" data-tone={tone}>
      {children}
    </span>
  )
}

/** An applied filter chip with its remove button. */
export function Chip({ children, onRemove, removeLabel }: { children: ReactNode; onRemove: () => void; removeLabel: string }): JSX.Element {
  return (
    <span className="ea-chip ea-frame">
      {children}
      <button type="button" aria-label={removeLabel} onClick={onRemove}>
        <Icon name="close" />
      </button>
    </span>
  )
}

/** A toggle chip: one filter value on or off (element, rarity). */
export function ToggleChip({
  pressed,
  onToggle,
  children,
  preview,
}: {
  pressed: boolean
  onToggle: () => void
  children: ReactNode
  preview?: 'hover' | 'focus'
}): JSX.Element {
  return (
    <button
      type="button"
      className="ea-toggle-chip ea-frame ea-edge"
      aria-pressed={pressed}
      data-preview={preview}
      onClick={onToggle}
    >
      {children}
    </button>
  )
}

/** Element mark: our sigil in the element's data colour plus the name in ink. Never colour alone. */
export function ElementMark({ element, labelled = true }: { element: Element; labelled?: boolean }): JSX.Element {
  return (
    <span className="ea-mark">
      <Sigil element={element} label={labelled ? undefined : ELEMENT_LABEL[element]} />
      {labelled ? ELEMENT_LABEL[element] : null}
    </span>
  )
}

/** Rarity mark: n stars in the rarity colour, read as "5 star". */
export function RarityMark({ rarity }: { rarity: 3 | 4 | 5 }): JSX.Element {
  return (
    <span className="ea-stars" style={{ color: `var(--rarity-${rarity})` }} role="img" aria-label={`${rarity} star`}>
      {Array.from({ length: rarity }, (_, i) => (
        <Icon key={i} name="star" style={{ inlineSize: '0.8em', blockSize: '0.8em', fill: 'currentColor' }} />
      ))}
    </span>
  )
}

/** Avatar: the signed-in person, as initials (no uploads). */
export function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }): JSX.Element {
  return (
    <span className="ea-avatar" data-size={size} aria-hidden="true">
      {initials}
    </span>
  )
}

/** Card: a news item or event; the whole card is one link (the title link stretched over it). */
export function Card({
  tag,
  title,
  meta,
  href,
  children,
  preview,
}: {
  tag?: string
  title: string
  meta?: ReactNode
  href: string
  children?: ReactNode
  preview?: 'hover' | 'focus'
}): JSX.Element {
  return (
    <article className="ea-card ea-frame ea-edge" data-tone="outline" data-preview={preview}>
      {tag ? <ChevronTag>{tag}</ChevronTag> : null}
      <h3>
        <a className="ea-card__link" href={href}>
          {title}
        </a>
      </h3>
      {children}
      {meta ? <span className="ea-card__meta">{meta}</span> : null}
    </article>
  )
}

/**
 * Resonator card: portrait plate (our sigil on the element-tinted resonance field, never game art), rarity bar and
 * stars, name, element and weapon. A link in the database; a toggle (selection ticks) in the team builder.
 */
export function ResonatorCard({
  resonator,
  size = 'grid',
  href,
  selected,
  onSelect,
  preview,
}: {
  resonator: Resonator
  size?: 'grid' | 'compact'
  href?: string
  selected?: boolean
  onSelect?: () => void
  preview?: 'hover' | 'focus'
}): JSX.Element {
  const style = vars({ '--_el': `var(--el-${resonator.element})`, '--_rarity': `var(--rarity-${resonator.rarity})` })
  const name = `${resonator.name}, ${ELEMENT_LABEL[resonator.element]}, ${resonator.weapon}, ${resonator.rarity} star`
  const portrait = portraitOf(resonator.id)
  // no portrait card: the full-body cut-out cropped to head and shoulders, before the sigil plate
  const full = portrait ? null : fullBodyOf(resonator.id)
  const body = (
    <>
      <span className="ea-res__plate" aria-hidden="true" data-portrait={portrait || full ? '' : undefined}>
        <span className="ea-field" data-shape="centre" />
        {portrait ? (
          <img className="ea-res__img" src={portrait} alt="" width={366} height={731} loading="lazy" decoding="async" />
        ) : full ? (
          <img className="ea-res__full" src={full} alt="" width={1536} height={1524} loading="lazy" decoding="async" />
        ) : (
          <>
            <Sigil element={resonator.element} size={size === 'compact' ? 'lg' : 'xl'} />
            <span className="ea-res__initial">{resonator.name.slice(0, 1)}</span>
          </>
        )}
        {/* compact (the in-game team select): the element sigil sits on the portrait's corner */}
        {size === 'compact' ? (
          <span className="ea-res__corner">
            <Sigil element={resonator.element} size="sm" />
          </span>
        ) : null}
      </span>
      <span className="ea-res__body">
        {size === 'grid' ? <span className="ea-res__bar" aria-hidden="true" /> : null}
        <span className="ea-res__name">{resonator.name}</span>
        {size === 'grid' ? (
          <span className="ea-res__meta">
            <ElementMark element={resonator.element} />
            <RarityMark rarity={resonator.rarity} />
            <span className="ea-res__weapon">{resonator.weapon}</span>
          </span>
        ) : null}
      </span>
      <span className="ea-ticks__mark" aria-hidden="true" />
    </>
  )
  if (onSelect) {
    return (
      <button
        type="button"
        className="ea-res ea-ticks"
        data-size={size}
        data-selected={selected || undefined}
        data-preview={preview}
        aria-pressed={selected ?? false}
        aria-label={name}
        style={style}
        onClick={onSelect}
      >
        {body}
      </button>
    )
  }
  return (
    <a className="ea-res ea-ticks" data-size={size} data-preview={preview} href={href ?? '#'} aria-label={name} style={style}>
      {body}
    </a>
  )
}

const SKELETON_RESONATOR: Resonator = { ...RESONATORS[0], id: 'skeleton', name: 'Resonator name' }

/**
 * The Resonator card's skeleton (ea-skel): the real card, inert, with its text shown as tuning bars and its plate
 * empty, under a notched outline that draws on. The loaded size by construction.
 */
export function ResonatorCardSkeleton({ size = 'grid' }: { size?: 'grid' | 'compact' }): JSX.Element {
  return (
    <div className="ea-skel ea-skel--res" aria-hidden="true" inert>
      <ResonatorCard resonator={SKELETON_RESONATOR} size={size} href="#" />
      <span className="ea-skel__line ea-frame" />
    </div>
  )
}

export interface Column<T> {
  readonly id: string
  readonly label: string
  readonly numeric?: boolean
  readonly sortable?: boolean
  readonly cell: (row: T) => ReactNode
}

/**
 * Table: real <table>, sentence-case muted header with no fill band, ruled rows, tabular numbers right-aligned,
 * sortable headers as buttons (aria-sort), selected rows with the gold edge. Wide tables scroll in a focusable,
 * labelled region.
 */
export function Table<T>({
  caption,
  columns,
  rows,
  rowKey,
  sort,
  onSort,
  selected = [],
}: {
  caption: string
  columns: readonly Column<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  sort?: { id: string; dir: 'ascending' | 'descending' }
  onSort?: (id: string) => void
  selected?: readonly string[]
}): JSX.Element {
  return (
    <div className="ea-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="ea-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                data-num={column.numeric || undefined}
                aria-sort={sort?.id === column.id ? sort.dir : undefined}
              >
                {column.sortable && onSort ? (
                  <button type="button" className="ea-table__sort" onClick={() => onSort(column.id)}>
                    {column.label}
                    <Icon name={sort?.id === column.id ? (sort.dir === 'ascending' ? 'arrowUp' : 'arrowDown') : 'sort'} />
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} aria-selected={selected.includes(rowKey(row)) || undefined}>
              {columns.map((column) => (
                <td key={column.id} data-num={column.numeric || undefined}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A change with its sign, icon and meaning colour (better or worse, never up or down). */
export function Delta({ value, better, unit = '%' }: { value: number; better: boolean | null; unit?: string }): JSX.Element {
  const tone = better === null || value === 0 ? 'neutral' : better ? 'positive' : 'negative'
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±'
  return (
    <span className="ea-delta" data-tone={tone}>
      {value !== 0 ? <Icon name={value > 0 ? 'arrowUp' : 'arrowDown'} style={{ inlineSize: '0.9em', blockSize: '0.9em' }} /> : null}
      {sign}
      {Math.abs(value).toFixed(1)}
      {unit}
      <span className="ea-sr-only">{better === null ? '' : better ? ', better than the target' : ', worse than the target'}</span>
    </span>
  )
}

/** Description list (stat list): label, dotted leader, value; a missing value is a muted dash. */
export function DescriptionList({
  items,
}: {
  items: readonly { label: ReactNode; value: ReactNode | null; delta?: ReactNode }[]
}): JSX.Element {
  return (
    <dl className="ea-dl">
      {items.map((item, index) => (
        <div key={index}>
          <dt>{item.label}</dt>
          <dd>
            {item.value ?? (
              <span style={{ color: 'var(--subtle)' }} aria-label="no value">
                —
              </span>
            )}{' '}
            {item.delta}
          </dd>
        </div>
      ))}
    </dl>
  )
}
