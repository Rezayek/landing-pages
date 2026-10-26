import { useState, type JSX } from 'react'
import { Skeleton } from '../feedback'
import { STYLES, portionsFor, priceFor, pounds, renderOf, type Cake } from './data'

export interface CakeCardProps {
  cake: Cake
  onOpen: (cake: Cake) => void
  /** Simulate a picture that fails to load (the /system page's state matrix). */
  brokenPicture?: boolean
}

/**
 * One cake in the gallery (COMPONENTS.md §Cake card): a 4:5 rendered study with its credit, the style chip, the name
 * and the facts, all one button that opens the details. While the picture loads, its box shows the style's petal
 * dust; if it fails, the box keeps that colour and says so. No hover lift, no shadow: only the picture eases closer.
 */
export function CakeCard({ cake, onOpen, brokenPicture }: CakeCardProps): JSX.Element {
  const style = STYLES.find((s) => s.value === cake.style) ?? STYLES[0]
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>(brokenPicture ? 'failed' : 'loading')
  const portions = portionsFor(cake.tiers, cake.shape)
  const price = priceFor({ tiers: cake.tiers, shape: cake.shape, finish: cake.finish, flowers: cake.flowers, goldLeaf: cake.style === 'modern', flavours: [] })
  return (
    <button type="button" className="ms-cakecard" data-petal={style.petal} onClick={() => onOpen(cake)} aria-label={`${cake.name}, ${style.label}: open the details`}>
      <span className="ms-cakecard__pic">
        {state === 'failed' ? (
          <span className="ms-cakecard__failed">Picture did not load</span>
        ) : (
          <img
            src={renderOf(cake)}
            width={1200}
            height={1500}
            loading="lazy"
            decoding="async"
            alt=""
            data-loading={state === 'loading' || undefined}
            onLoad={() => setState('loaded')}
            onError={() => setState('failed')}
          />
        )}
        <span className="ms-cakecard__credit">Rendered study</span>
      </span>
      <span className="ms-chip ms-cakecard__chip" data-petal={style.petal} aria-hidden="true">
        {style.label}
      </span>
      <span className="ms-cakecard__name">{cake.name}</span>
      <span className="ms-cakecard__facts">
        {cake.tiers} {cake.tiers === 1 ? 'tier' : 'tiers'} · about {portions} portions · from {pounds(price.low)} (sample price)
      </span>
    </button>
  )
}

/** The card's skeleton, from the same layout: the picture block in the style's petal dust and two lines. */
export function CakeCardSkeleton({ petal = 'classic' }: { petal?: string }): JSX.Element {
  return (
    <div className="ms-cakecard-skel" data-petal={petal} aria-hidden="true">
      <span className="ms-cakecard__pic" />
      {/* the style chip's row, unseen: the real chip's own class, so the slot is as tall as the card it stands for */}
      <span className="ms-chip ms-cakecard__chip" style={{ visibility: 'hidden' }}>
        Classic
      </span>
      <Skeleton variant="heading" />
      <Skeleton variant="text" lines={1} />
    </div>
  )
}
