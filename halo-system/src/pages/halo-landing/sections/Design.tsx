/**
 * S4 Design (UX.md): the visitor builds their HALO on the live model and sees the price. Size, case and band are the
 * system's radio groups; a choice changes the model in place (A10-A12) and the price and delivery update under the
 * stale bar (A13). The watch is the story canvas's own (one WebGL context for the whole page): it carries on from the
 * wrist into this section's shot as `onEnter` rises. Without WebGL the system's drawn watch shows the same build.
 */
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, useState, type JSX } from 'react'
import { BANDS, Button, DialControl, FACES, FINISHES, PriceSummary, SegmentedChoice, SIZES, SwatchPicker, Watch, type Build, type PriceState } from '@/system/halo'
import { story } from '../story'
import { euro } from '@/system/halo'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export interface DesignProps {
  build: Build
  onChange: (patch: Partial<Build>) => void
  price: PriceState
  delivery: string
  onRetry: () => void
  onPreorder: () => void
  live: boolean
  reduced: boolean
  /** 0-1 while the section scrolls into view: the story's camera moves from the wrist to this shot. */
  onEnter: (value: number) => void
}

const sizeOptions = SIZES.map((s) => ({ id: s.id, label: s.label }))
/** The selected size's wrist range, shown beside the label (a sub-line per option would not fit a 320 px column). */
const wristNote = (id: string): string => {
  const size = SIZES.find((s) => s.id === id)
  return size ? `wrists ${size.wrist[0]}–${size.wrist[1]} mm` : ''
}
const faceSteps = FACES.map((f) => ({ id: f.id, label: f.label }))
const finishOptions = FINISHES.map((f) => ({ id: f.id, label: f.price ? `${f.label} (+${euro(f.price)})` : f.label, hex: f.metal[1] }))

export function Design({ build, onChange, price, delivery, onRetry, onPreorder, live, reduced, onEnter }: DesignProps): JSX.Element {
  const root = useRef<HTMLElement>(null)
  const [face, setFace] = useState(0)
  const soldOut = BANDS.find((b) => b.id === build.band)?.soldOutIn === build.size

  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const enter = { v: 0 }
      gsap.to(enter, {
        v: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 15%', scrub: reduced ? true : 0.8 },
        onUpdate: () => onEnter(enter.v),
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  const bandOptions = BANDS.map((b) => ({ id: b.id, label: b.label, hex: b.hex, unavailable: b.soldOutIn === build.size }))

  return (
    <section ref={root} id="design" className="design" aria-labelledby="design-title" data-moment="build">
      <div className="design__copy">
        <h2 id="design-title" className="section-title">
          Your case, your band.
        </h2>
        <p className="section-sub">Two titanium finishes, two sizes and five bands. The watch changes as you choose.</p>
        <div className="design__controls">
          <SegmentedChoice label="Size" options={sizeOptions} value={build.size} note={wristNote(build.size)} onChange={(id) => onChange({ size: id as Build['size'] })} />
          <SwatchPicker label="Case" shape="finish" options={finishOptions} value={build.finish} onChange={(id) => onChange({ finish: id as Build['finish'] })} />
          <SwatchPicker label="Band" options={bandOptions} value={build.band} onChange={(id) => onChange({ band: id as Build['band'] })} />
          {/* the side dial's detents (style contract): each step turns the model's dial a notch and changes its face */}
          <DialControl
            label="Face"
            steps={faceSteps}
            value={face}
            onChange={(i) => {
              setFace(i)
              story.faceIndex = i
            }}
          />
        </div>
        <PriceSummary build={build} state={price} delivery={delivery} onRetry={onRetry} />
        <div className="design__action">
          <Button
            variant="primary"
            size="large"
            unavailable={soldOut ? 'Glacier blue in 41 mm ships from December. Choose 45 mm or another band.' : undefined}
            onClick={onPreorder}
          >
            Pre-order this HALO
          </Button>
          {soldOut ? null : <p className="design__note">Nothing is charged until it ships. A design study.</p>}
        </div>
      </div>
      {/* the story canvas draws the watch in this box's place; without WebGL, the system's drawn watch stands in */}
      <div className="design__stage" role="img" aria-label={`HALO in ${build.size} mm, ${FINISHES.find((f) => f.id === build.finish)?.label}, ${BANDS.find((b) => b.id === build.band)?.label} band`}>
        {live ? null : <Watch build={build} face={face} width={260} className="design__drawn" />}
      </div>
    </section>
  )
}
