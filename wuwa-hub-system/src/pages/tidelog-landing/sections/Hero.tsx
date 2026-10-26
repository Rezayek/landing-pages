/**
 * S1 Hero, the Echo orbit (CONCEPT.md R2-5), re-socketable (agreed round 1, A1-A5): Jinhsi on the night stage in the
 * resonance field, her five Echoes in notched plates on an arc around her, each joined to her by a drawn trace. A plate
 * is a socket: pressing it opens a tray of that cost's main stats; choosing one re-sockets the plate (resonate ripple,
 * sparks) and the readout under her retunes. The build is shared with S2 and S3 and can be copied as a link.
 * Text and plates are in the first render; the art fills a reserved box. Copy: UX.md S1.
 */
import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type MouseEvent, type Ref } from 'react'
import { announce } from '@/system/feedback'
import { burst, play, reducedMotion } from '@/system/vfx'
import { Button, ChevronTag, GameIcon } from '@/system/components'
import { useBuild } from './build'
import { drawBuildImage, saveBlob } from './buildImage'
import { COST_LIMIT, ECHO_POOL, LINKS, MAINS, costOf, echoOf, mainOf, statsOf, type BuildSlot } from './data'

/** Where each plate sits on the stage (% across, % down) on wider screens, and where the traces meet her. */
const ORBIT: readonly (readonly [number, number])[] = [
  [48, 20],
  [88, 18],
  [87, 40],
  [87, 62],
  [48, 40],
]
/** Her heart in the key art at the stage's crop, and how far toward it a trace runs. */
const ANCHOR: readonly [number, number] = [66, 44]
const TRACE_REACH = 0.8

export function Hero(): JSX.Element {
  const { slots, setSlot, reset, changed, link } = useBuild()
  const [open, setOpen] = useState<number | null>(null)
  const [rung, setRung] = useState<readonly number[]>([0, 0, 0, 0, 0])
  // the whole hero answers a re-socket (round 4, D2): which plate, and a counter that restarts the one-shot effects
  const [flash, setFlash] = useState<{ index: number; n: number }>({ index: -1, n: 0 })
  const readout = useRef<HTMLDivElement>(null)
  const plates = useRef<(HTMLButtonElement | null)[]>([])
  const orbit = useRef<HTMLUListElement>(null)
  const stats = statsOf(slots)
  const cost = costOf(slots)

  // a press outside the open socket and its tray closes it
  useEffect(() => {
    if (open === null) return
    const close = (event: PointerEvent): void => {
      if (!orbit.current?.children[open]?.contains(event.target as Node)) setOpen(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  function choose(index: number, slot: BuildSlot): void {
    setSlot(index, slot)
    setOpen(null)
    setRung((r) => r.map((n, i) => (i === index ? n + 1 : n)))
    setFlash((f) => ({ index, n: f.n + 1 }))
    plates.current[index]?.focus()
    const plate = plates.current[index]?.closest<HTMLElement>('.tl-slot') ?? null
    const next = statsOf(slots.map((s, i) => (i === index ? slot : s)))
    const m = mainOf(slot)
    announce(`${ECHO_POOL[slot.key].name} now carries ${m.stat} ${m.value}. Crit Rate ${next.critRate}%, Crit DMG ${next.critDmg}%.`)
    if (plate && !reducedMotion()) {
      // a light passes over the re-socketed plate, so the change is seen where it happened
      void play(plate, 'sweep')
      void play(readout.current, 'sweep')
      const style = getComputedStyle(plate)
      burst(plate, { count: 3, spread: 28, colors: ['--band-accent', '--band-ink'].map((t) => style.getPropertyValue(t).trim()) })
    }
  }

  function onTrayKey(event: KeyboardEvent<HTMLDivElement>, index: number): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(null)
      plates.current[index]?.focus()
    }
  }

  return (
    <section className="tl-hero" aria-labelledby="hero-title" data-moment="hero">
      {/* the stage: the game's moonlit key art of her (public/resonators/art/CREDITS.md) */}
      <div className="tl-hero__figure" aria-hidden="true">
        <img src="/resonators/art/jinhsi-moonlit.webp" alt="" width={1920} height={1080} fetchPriority="high" decoding="async" />
        <span className="tl-hero__glow" />
        {/* a gold light crosses the art once when a plate is re-socketed */}
        {flash.n ? <span key={flash.n} className="tl-hero__light" /> : null}
      </div>
      <span className="ea-field tl-hero__field" data-field="drift" aria-hidden="true" />
      <svg className="tl-traces" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {ORBIT.map(([x, y], i) => (
          // each trace runs from its plate most of the way to her, ending short of her so it never crosses the art's face
          <path
            key={flash.index === i ? `${i}-${flash.n}` : i}
            className={flash.index === i ? 'tl-trace--flash' : undefined}
            d={`M${x} ${y} L${x + (ANCHOR[0] - x) * TRACE_REACH} ${y + (ANCHOR[1] - y) * TRACE_REACH}`}
            vectorEffect="non-scaling-stroke"
            style={{ '--i': i } as CSSProperties}
          />
        ))}
      </svg>
      <ul className="tl-orbit" ref={orbit} aria-label="Jinhsi's five Echoes. Press one to change its main stat.">
        {slots.map((slot, i) => {
          const echo = echoOf(slot)
          const trayId = `tl-tray-${i}`
          return (
            <li key={i} className="tl-orbit__slot" style={{ '--i': i, '--x': `${ORBIT[i][0]}%`, '--y': `${ORBIT[i][1]}%` } as CSSProperties} data-open={open === i || undefined}>
              {/* the plate is the socket's frame; its one button carries the name (one line) and covers the plate */}
              <div className="tl-slot ea-frame ea-edge">
                <GameIcon icon={echo.icon} fallback="echo" size="md" />
                <span className="tl-slot__cost" aria-hidden="true">
                  {echo.cost}
                </span>
                <span className="tl-slot__text">
                  <button
                    ref={(el) => {
                      plates.current[i] = el
                    }}
                    type="button"
                    className="tl-slot__btn"
                    aria-expanded={open === i}
                    aria-controls={trayId}
                    aria-label={`Slot ${i + 1}: ${echo.name}, cost ${echo.cost}, ${echo.main[0]} ${echo.main[1]}. Change its main stat`}
                    onClick={() => setOpen((o) => (o === i ? null : i))}
                  >
                    {echo.name}
                  </button>
                  <small aria-hidden="true">
                    Cost {echo.cost} · {echo.main[0]} {echo.main[1]}
                  </small>
                </span>
                {/* the entrance beat: one ring as the plate lands (CSS, once; none under reduced motion) */}
                <span className="tl-slot__pulse" aria-hidden="true" />
                {rung[i] ? <span key={rung[i]} className="ea-ripple" style={{ insetInlineStart: '50%', insetBlockStart: '50%' }} aria-hidden="true" /> : null}
              </div>
              {open === i ? (
                <div id={trayId} className="tl-tray ea-frame" role="group" aria-label={`Main stat for ${echo.name}`} onKeyDown={(e) => onTrayKey(e, i)}>
                  <p className="tl-tray__head">
                    <strong>{echo.name}</strong> · cost {echo.cost} main stat
                  </p>
                  <div className="tl-tray__options">
                    {MAINS[echo.cost].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="tl-tray__option"
                        aria-pressed={m.id === mainOf(slot).id}
                        // the tray opens on the stat the socket carries now
                        autoFocus={m.id === mainOf(slot).id}
                        onClick={() => choose(i, { key: slot.key, main: m.id })}
                      >
                        <span>{m.stat}</span>
                        <span data-numeric="">{m.value}</span>
                      </button>
                    ))}
                  </div>
                  <p className="tl-tray__rule">
                    A main-stat swap keeps the cost at {cost} of {COST_LIMIT}.
                  </p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      <Readout
        ref={readout}
        slots={slots}
        cost={cost}
        stats={stats}
        changed={changed}
        onReset={() => {
          reset()
          announce("Back to Jinhsi's sample build.")
          // the reset button leaves with the change: focus goes to the first socket
          window.requestAnimationFrame(() => plates.current[0]?.focus())
        }}
        link={link}
      />
      <div className="tl-hero__copy">
        <h1 id="hero-title" className="tl-hero__title">
          {/* phones show "Builds, laid out like the game."; the game's name stays in the heading for screen readers */}
          <span className="tl-hero__game">Wuthering Waves </span>
          <span className="tl-hero__builds">builds,</span> laid out like the game.
        </h1>
        <p className="tl-hero__sub">
          Look up any Wuthering Waves Resonator's Echoes, weapon and Forte priority. Plan your five Echoes, then build a team around them.
        </p>
        <div className="tl-actions">
          <a className="ea-btn ea-frame ea-edge" data-variant="primary" href={LINKS.database}>
            Find a Resonator's build
          </a>
          <a className="ea-link" data-standalone="" href="#build">
            See what Jinhsi farms
          </a>
        </div>
        <p className="tl-note">Free, no ads. Sign in only to save builds.</p>
      </div>
    </section>
  )
}

/** The build's readout under her: cost as pips, the set as ticks, the two crit numbers, and the link to share it. */
function Readout({
  ref,
  slots,
  cost,
  stats,
  changed,
  onReset,
  link,
}: {
  ref?: Ref<HTMLDivElement>
  slots: readonly BuildSlot[]
  cost: number
  stats: ReturnType<typeof statsOf>
  changed: boolean
  onReset: () => void
  link: () => string
}): JSX.Element {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const [saved, setSaved] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle')
  useEffect(() => {
    if (copied !== 'done') return
    const t = window.setTimeout(() => setCopied('idle'), 1500)
    return () => window.clearTimeout(t)
  }, [copied])
  useEffect(() => {
    if (saved !== 'done') return
    const t = window.setTimeout(() => setSaved('idle'), 1500)
    return () => window.clearTimeout(t)
  }, [saved])
  // "Save build image" (round 4, D1): drawn here, in the page's colours, and handed to the browser to save
  async function save(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    if (saved === 'busy') return
    setSaved('busy')
    try {
      const url = new URL(link())
      const blob = await drawBuildImage(slots, event.currentTarget, `${url.host}${url.pathname}`)
      saveBlob(blob, 'jinhsi-build.png')
      setSaved('done')
      announce('Build image saved.')
    } catch {
      setSaved('failed')
      announce("Couldn't draw the build image. Try again.", 'assertive')
    }
  }
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(link())
      setCopied('done')
      announce('Build link copied.')
    } catch {
      setCopied('failed')
      announce("Couldn't copy the link. It's in the field below: select it and copy.", 'assertive')
    }
  }
  return (
    <div ref={ref} className="tl-readout ea-frame">
      <div className="tl-readout__row">
        <ChevronTag>Sample build</ChevronTag>
        <span className="tl-readout__label">Jinhsi</span>
      </div>
      <dl className="tl-readout__stats">
        <div>
          <dt>Cost</dt>
          <dd>
            <span className="tl-pips" role="img" aria-label={`${cost} of ${COST_LIMIT}`}>
              {Array.from({ length: COST_LIMIT }, (_, i) => (
                <i key={i} data-on={i < cost || undefined} />
              ))}
            </span>
          </dd>
        </div>
        <div>
          <dt>Celestial Light</dt>
          <dd>
            <span className="tl-pips" data-kind="set" role="img" aria-label={`${stats.set} of 5 pieces`}>
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} data-on={i < stats.set || undefined} />
              ))}
            </span>
          </dd>
        </div>
        <div>
          <dt>Crit Rate</dt>
          <dd className="tl-readout__num" data-numeric="">
            {stats.critRate}%
          </dd>
        </div>
        <div>
          <dt>Crit DMG</dt>
          <dd className="tl-readout__num" data-numeric="">
            {stats.critDmg}%
          </dd>
        </div>
      </dl>
      <div className="tl-readout__row">
        {/* a quiet text link, so the gold button stays the one gold action in view (round 2) */}
        <button type="button" className="ea-link tl-readout__copy" data-standalone="" aria-label={copied === 'done' ? 'Link copied' : 'Copy build link'} onClick={() => void copy()}>
          {copied === 'done' ? 'Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          className="ea-link tl-readout__copy"
          data-standalone=""
          aria-disabled={saved === 'busy' || undefined}
          aria-label={saved === 'busy' ? 'Drawing the build image' : saved === 'done' ? 'Build image saved' : 'Save build image'}
          onClick={(e) => void save(e)}
        >
          {saved === 'busy' ? 'Drawing…' : saved === 'done' ? 'Saved' : 'Save image'}
        </button>
        <Button variant="quiet" aria-label="Reset to her build" onClick={onReset} disabledReason={changed ? undefined : 'This is already her sample build.'}>
          Reset
        </Button>
      </div>
      {saved === 'failed' ? <p className="tl-readout__error">Couldn't draw the build image. Try again.</p> : null}
      {/* how a stranger finds the sockets, and why Reset is off (round 4, D2) */}
      <p className="tl-readout__hint">{changed ? 'Press an Echo to change another main stat.' : 'Her sample build. Press an Echo to change its main stat.'}</p>
      {copied === 'failed' ? (
        <label className="tl-readout__fallback">
          <span>Couldn't copy the link. Select it here and copy:</span>
          <input className="ea-input" readOnly value={link()} onFocus={(e) => e.currentTarget.select()} />
        </label>
      ) : null}
    </div>
  )
}
