import { useEffect, useId, useRef, type JSX } from 'react'
import { CloseIcon } from '../feedback/icons'
import { EmptyState, toast } from '../feedback'
import { IconButton } from '../ui'
import { play } from '../vfx'
import type { Flavour } from './data'

export const BOX_SIZE = 6 // sample: six slices at a tasting

export interface TastingBoxProps {
  kept: readonly Flavour[]
  onRemove: (flavour: Flavour) => void
  onRestore: (flavour: Flavour, index: number) => void
  /** The box was emptied by the couple (not first use). */
  cleared?: boolean
  bookHref?: string
  /** 4 where the box sits under another h3 (the /system component demos). */
  headingLevel?: 3 | 4
}

/**
 * The six flavours kept for the tasting, as a box of six slots you can count (COMPONENTS.md §Tasting box). A kept
 * flavour settles into the next slot ('stack'); a full box earns the gold fleck ('gild'). Removing one offers Undo
 * in a toast for 10 s, the only toast on the site, and the flavour stays in the flavours section too.
 */
export function TastingBox({ kept, onRemove, onRestore, cleared, bookHref = '#tastings', headingLevel = 3 }: TastingBoxProps): JSX.Element {
  const Heading = headingLevel === 4 ? 'h4' : 'h3'
  const titleId = useId()
  const fleck = useRef<HTMLSpanElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const full = kept.length >= BOX_SIZE
  useEffect(() => {
    if (full) void play(fleck.current, 'gild')
  }, [full])

  function remove(flavour: Flavour, index: number): void {
    // focus goes to the next remove button, else the previous one, else the box itself (heading or empty state,
    // which share the id): it never falls back to the page
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>('.ms-iconbtn')
    const next = buttons?.[index + 1] ?? buttons?.[index - 1] ?? null
    onRemove(flavour)
    requestAnimationFrame(() => (next ?? document.getElementById(titleId))?.focus())
    toast(`${flavour.name} removed.`, {
      action: { label: 'Undo', onClick: () => onRestore(flavour, index) },
      duration: 10_000,
    })
  }

  if (!kept.length) {
    return (
      <div className="ms-box" id={titleId} tabIndex={-1}>
        <EmptyState
          kind={cleared ? 'cleared' : 'first-use'}
          title={cleared ? 'Your box is empty again' : 'Keep up to six flavours'}
          headingLevel={headingLevel}
          action={
            cleared ? undefined : (
              <a className="ms-btn" data-variant="secondary" href="#flavours">
                See the flavours
              </a>
            )
          }
        >
          {cleared ? 'Keep any flavour to add it back.' : "Choose the ones you'd like to taste together; we'll bake a slice of each."}
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="ms-box" role="group" aria-labelledby={titleId}>
      <div className="ms-box__head">
        <Heading id={titleId} tabIndex={-1} className="ms-display">
          Your tasting box
        </Heading>
        <span className="ms-box__count">
          {full ? <span className="ms-box__fleck" ref={fleck} aria-hidden="true" /> : null}
          {kept.length} of {BOX_SIZE}
        </span>
      </div>
      <ul className="ms-box__grid" ref={list} aria-label={`${kept.length} of ${BOX_SIZE} flavours kept`}>
        {Array.from({ length: BOX_SIZE }, (_, i) => {
          const flavour = kept[i]
          if (!flavour) return <li key={`empty-${i}`} className="ms-box__empty" aria-hidden="true" />
          return (
            <li key={flavour.id} className="ms-box__cell">
              {/* first, so it floats in the corner and the name flows around it */}
              <IconButton label={`Remove ${flavour.name}`} icon={<CloseIcon />} onClick={() => remove(flavour, i)} />
              {flavour.name}
            </li>
          )
        })}
      </ul>
      <p className="ms-box__note">
        {full ? 'Your box is full. ' : ''}
        <a className="ms-link" data-standalone href={bookHref}>
          Book a tasting for these flavours
        </a>
      </p>
    </div>
  )
}
