import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type PointerEvent } from 'react'
import { InlineMessage, announce } from '@/system/feedback'
import { prefersReducedMotion } from '@/system/motion'
import { Button } from '@/system/ui'
import { decode, play } from '@/system/vfx'
import { BUILDS, playerById } from '@/system/social/fixtures'
import type { Structure } from '@/system/pixel/textures'
import {
  PLOT_AT,
  WORLD,
  drawNight,
  drawSelection,
  drawSky,
  drawTextured,
  heightMap,
  makeTextures,
  modelFor,
  pick,
  readPalette,
  terrain,
  type Block,
  type FaceTextures,
  type Voxel,
} from './voxels'
import { TP_EVENT } from './world'
import './hero.css'

interface Place {
  readonly id: string
  readonly title: string
  readonly by: string
  readonly seed: string
  readonly coords: readonly [number, number, number]
  readonly structure: Structure
}

/** The hero's own build (sample, invented like the fixtures). */
const HOME: Place = { id: 'home', title: 'Harbor Watch Lighthouse', by: playerById('harbormoth').name, seed: '7F3A-29QX', coords: [120, 64, -340], structure: 'lighthouse' }

const STEP_MS = 100 // --dur-sm: one stepped frame
const PER_FRAME = 6
const BLINK_MS = 800 // half of --dur-loop-pulse
const MAX_Y = 14

/** The blocks the visitor can place, in hotbar order (keys 1-6). */
const PALETTE: readonly { b: Block; label: string }[] = [
  { b: 'grass', label: 'Grass' },
  { b: 'stone', label: 'Stone' },
  { b: 'plank', label: 'Planks' },
  { b: 'glass', label: 'Glass' },
  { b: 'lamp', label: 'Lamp' },
  { b: 'roof', label: 'Brick' },
]
const NAME: Partial<Record<Block, string>> = { grass: 'grass', stone: 'stone', plank: 'planks', glass: 'glass', lamp: 'a lamp', roof: 'brick', dirt: 'dirt', sand: 'sand', log: 'a log', leaf: 'leaves', flower: 'a flower', poppy: 'a flower', tallgrass: 'tall grass' }

const xyz = (c: readonly number[], sep = ', '): string => `X ${c[0]}${sep}Y ${c[1]}${sep}Z ${c[2]}`
const key = (x: number, y: number, z: number): string => `${x},${y},${z}`
const inPlot = (x: number, z: number): boolean => x >= PLOT_AT.x && x < PLOT_AT.x + 8 && z >= PLOT_AT.z && z < PLOT_AT.z + 8
const FRONT = PLOT_AT.x + PLOT_AT.z + 14 // columns past this sum are in front of the build

function placeOf(id: string): Place | null {
  const b = BUILDS.find((x) => x.id === id)
  if (!b) return null
  return { id: b.id, title: b.title, by: playerById(b.author).name, seed: b.seed, coords: b.coords, structure: b.structure }
}

function scrollToSignup(): void {
  document.getElementById('signup')?.scrollIntoView({ block: 'start' })
  window.setTimeout(() => document.getElementById('signup-name')?.focus({ preventScroll: true }), 0)
}

interface View {
  readonly w: number
  readonly h: number
  readonly u: number
  readonly ox: number
  readonly oy: number
}

/** The camera: cube size from the box width (the world fills it edge to edge), the plot where the composition wants it. */
function viewFor(w: number, h: number): View {
  const wide = w > 768 // matches the CSS: at 48rem (768 px) and below, the world is the short phone strip
  // phones: the strip is short, so the cube also fits the build and its label into the height
  const u = wide ? Math.max(14, Math.min(26, Math.round(w / 66))) : Math.max(8, Math.floor(h / 22))
  const cx = PLOT_AT.x + 4
  const cz = PLOT_AT.z + 4
  const anchorX = wide ? w * 0.6 : w / 2
  const anchorY = wide ? h * 0.66 : h * 0.8
  return { w, h, u, ox: Math.round(anchorX - (cx - cz) * u), oy: Math.round(anchorY - (cx + cz) * (u / 2)) }
}

/**
 * S1 Hero: a slice of world at night, full-bleed, that the visitor can build in. The build assembles block by block on
 * its plot by the shore, its address on the HUD; the visitor places its last block, then can place and break blocks
 * anywhere around it (pointer, a touch toggle or the keyboard). /tp from the feed assembles another build on the plot.
 */
export function Hero(): JSX.Element {
  const [place, setPlace] = useState<Place>(HOME)
  const model = useMemo<Voxel[]>(() => modelFor(place.structure).map((v) => ({ ...v, x: v.x + PLOT_AT.x, z: v.z + PLOT_AT.z })), [place.structure])
  const base = useMemo(() => terrain(), [])
  const [edits, setEdits] = useState<ReadonlyMap<string, Block | null>>(() => new Map())
  const world = useMemo(() => {
    const out = base.filter((v) => !edits.has(key(v.x, v.y, v.z)))
    for (const [k, b] of edits) {
      if (!b) continue
      const [x, y, z] = k.split(',').map(Number)
      out.push({ x, y, z, b })
    }
    return out
  }, [base, edits])
  const backWorld = useMemo(() => world.filter((v) => !(v.x + v.z > FRONT && v.y >= 1)), [world])
  const frontWorld = useMemo(() => world.filter((v) => v.x + v.z > FRONT && v.y >= 1), [world])
  const heights = useMemo(() => heightMap([...world, ...model]), [world, model])
  const total = model.length
  const top = useMemo(() => model.reduce((m, v) => Math.max(m, v.y), 0) + 1, [model])
  const reduced = useRef(prefersReducedMotion())
  const [count, setCount] = useState(() => (prefersReducedMotion() ? total - 1 : 0))
  const [phase, setPhase] = useState<'build' | 'dissolve'>('build')
  const [placed, setPlaced] = useState(false)
  const [dim, setDim] = useState(false)
  const [view, setView] = useState<View | null>(null)
  const [cursor, setCursor] = useState<{ x: number; z: number } | null>(null)
  const [tool, setTool] = useState<Block>('stone')
  const [mode, setMode] = useState<'place' | 'break'>('place')
  // a browser that cannot draw 2D canvas gets the build's address in words instead of the world (UX.md row 5)
  const [canDraw] = useState(() => document.createElement('canvas').getContext('2d') !== null)
  const pending = useRef<Place | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const backdrop = useRef<HTMLCanvasElement | null>(null)
  const textures = useRef<Record<Block, FaceTextures> | null>(null)
  const colours = useRef({ edge: '#000', select: '#fff' })
  const paint = useRef<() => void>(() => {})
  const caption = useRef<HTMLParagraphElement>(null)
  const hud = useRef<HTMLDivElement>(null)

  // the camera follows the box size
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = (): void => setView(viewFor(el.clientWidth, el.clientHeight))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // the sky and the world behind the build, painted into an offscreen canvas when the size or the world changes
  useEffect(() => {
    const c = canvas.current
    if (!view || !c) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const off = document.createElement('canvas')
    off.width = Math.round(view.w * ratio)
    off.height = Math.round(view.h * ratio)
    const ctx = off.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.imageSmoothingEnabled = false
    drawSky(ctx, c, view.w, view.h, view.u)
    const style = getComputedStyle(c)
    colours.current = { edge: style.getPropertyValue('--edge').trim(), select: style.getPropertyValue('--select').trim() }
    const tex = textures.current ?? makeTextures(readPalette(c))
    textures.current = tex
    drawTextured(ctx, backWorld, backWorld.length, tex, colours.current.edge, view.u, view.ox, view.oy, ratio)
    backdrop.current = off
    paint.current()
  }, [view, backWorld])

  // stepped frames: build up to one block short (the visitor places the last), or dissolve down to nothing
  const target = placed ? total : total - 1
  useEffect(() => {
    if (phase === 'build' && count >= target) return
    if (phase === 'dissolve' && count <= 0) {
      const next = pending.current
      pending.current = null
      if (next) {
        setPlace(next)
        setPlaced(true)
      }
      setPhase('build')
      return
    }
    const t = window.setTimeout(() => setCount((n) => (phase === 'build' ? Math.min(target, n + PER_FRAME) : Math.max(0, n - PER_FRAME * 2))), STEP_MS)
    return () => window.clearTimeout(t)
  }, [count, phase, target])

  // a new model starts from nothing (teleport), at once under reduced motion
  useEffect(() => {
    if (place.id === HOME.id) return
    setCount(reduced.current ? total : 0)
  }, [place.id, total])

  // the lamp blinks three times once the build is complete, then stays lit
  const complete = phase === 'build' && count >= target
  useEffect(() => {
    if (!complete || reduced.current) return
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setDim((d) => !d)
      if (n >= 6) {
        window.clearInterval(id)
        setDim(false)
      }
    }, BLINK_MS)
    return () => window.clearInterval(id)
  }, [complete, place.id])

  // draw: the back of the world, the build, anything placed in front of it, the night, the selection frame
  const drawFrame = (): void => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    const tex = textures.current
    if (!c || !ctx || !view || !tex) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    if (c.width !== Math.round(view.w * ratio)) c.width = Math.round(view.w * ratio)
    if (c.height !== Math.round(view.h * ratio)) c.height = Math.round(view.h * ratio)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, c.width, c.height)
    if (backdrop.current) ctx.drawImage(backdrop.current, 0, 0)
    const { edge, select } = colours.current
    drawTextured(ctx, model, count, dim ? { ...tex, lamp: tex.stone } : tex, edge, view.u, view.ox, view.oy, ratio)
    if (frontWorld.length) drawTextured(ctx, frontWorld, frontWorld.length, tex, edge, view.u, view.ox, view.oy, ratio)
    drawNight(ctx, c, view.w, view.h, view.u, view.ox, view.oy, ratio, count >= total && !dim)
    if (cursor) drawSelection(ctx, select, cursor.x, heights[cursor.x][cursor.z] - 1, cursor.z, view.u, view.ox, view.oy, ratio)
  }
  useEffect(() => {
    paint.current = drawFrame
    drawFrame()
  })

  // the HUD values resolve once per place (decode: a value arrived)
  useEffect(() => {
    hud.current?.querySelectorAll<HTMLElement>('[data-decode]').forEach((el) => void decode(el, el.dataset.decode ?? '', { duration: 600 }))
  }, [place.id])

  const placeBlock = useCallback(() => {
    if (placed) return
    setPlaced(true)
    setCount(total)
    void play(box.current?.querySelector<HTMLElement>('.bl-hero__tag') ?? null, 'pop')
    announce(`Built. ${total} blocks at ${xyz(place.coords)}. Now place or break blocks anywhere in the world.`)
    // the button goes away with the last block: focus moves to the build's caption, not to the page body
    window.setTimeout(() => caption.current?.focus({ preventScroll: true }), 0)
  }, [placed, total, place.coords])

  /* ----- editing the world ----- */
  const edit = useCallback(
    (x: number, z: number, action: 'place' | 'break') => {
      if (inPlot(x, z)) {
        announce('That is the build’s plot. Place and break blocks around it.')
        return
      }
      const h = heights[x][z]
      if (action === 'place') {
        if (h >= MAX_Y) return
        setEdits((prev) => new Map(prev).set(key(x, h, z), tool))
        announce(`Placed ${NAME[tool] ?? tool}`)
        return
      }
      const y = h - 1
      if (y < 0) return
      const here = world.find((v) => v.x === x && v.y === y && v.z === z)
      if (!here || here.b === 'water') return
      setEdits((prev) => new Map(prev).set(key(x, y, z), null))
      announce(`Broke ${NAME[here.b] ?? here.b}`)
    },
    [heights, tool, world],
  )

  const pointAt = (e: PointerEvent<HTMLCanvasElement>): { x: number; z: number } | null => {
    if (!view) return null
    const r = e.currentTarget.getBoundingClientRect()
    return pick(e.clientX - r.left, e.clientY - r.top, heights, view.u, view.ox, view.oy)
  }
  const onMove = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (placed && e.pointerType === 'mouse') setCursor(pointAt(e))
  }
  const onDown = (e: PointerEvent<HTMLCanvasElement>): void => {
    if (!placed) return
    const at = pointAt(e)
    if (!at) return
    setCursor(at)
    edit(at.x, at.z, e.button === 2 || e.shiftKey || mode === 'break' ? 'break' : 'place')
  }
  const onKey = (e: KeyboardEvent<HTMLCanvasElement>): void => {
    if (!placed) return
    const at = cursor ?? { x: PLOT_AT.x + 4, z: PLOT_AT.z + 9 }
    const move: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, 1], ArrowRight: [0, -1] }
    const digit = Number.parseInt(e.key, 10)
    if (move[e.key]) {
      const [dx, dz] = move[e.key]
      setCursor({ x: Math.max(0, Math.min(WORLD - 1, at.x + dx)), z: Math.max(0, Math.min(WORLD - 1, at.z + dz)) })
    } else if (e.key === 'Enter' || e.key === ' ') {
      setCursor(at)
      edit(at.x, at.z, mode)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      setCursor(at)
      edit(at.x, at.z, 'break')
    } else if (digit >= 1 && digit <= PALETTE.length) {
      setTool(PALETTE[digit - 1].b)
      announce(`${PALETTE[digit - 1].label} selected`)
    } else return
    e.preventDefault()
  }
  const reset = (): void => {
    setEdits(new Map())
    announce('World reset')
  }

  // /tp from anywhere on the page
  useEffect(() => {
    const onTp = (e: Event): void => {
      const next = placeOf((e as CustomEvent<{ buildId: string }>).detail.buildId)
      if (!next) return
      document.getElementById('top')?.scrollIntoView({ block: 'start' })
      announce(`Teleported to ${next.title} at ${xyz(next.coords)}`)
      if (reduced.current) {
        setPlace(next)
        setPlaced(true)
      } else {
        pending.current = next
        setPhase('dissolve')
      }
      window.setTimeout(() => caption.current?.focus({ preventScroll: true }), 0)
    }
    window.addEventListener(TP_EVENT, onTp)
    return () => window.removeEventListener(TP_EVENT, onTp)
  }, [])

  const building = phase === 'dissolve' || count < target
  const pct = Math.round((count / total) * 100)
  const ready = !placed && !building

  // the build's label floats above its top block
  const tagStyle: CSSProperties | undefined = view
    ? {
        left: `${view.ox + (PLOT_AT.x + 4 - (PLOT_AT.z + 4)) * view.u}px`,
        top: `${view.oy + (PLOT_AT.x + 4 + PLOT_AT.z + 4) * (view.u / 2) - top * view.u}px`,
      }
    : undefined

  return (
    <section id="top" className="bl-hero" data-y="64" data-y-label="surface" aria-labelledby="hero-title">
      <div className="bl-hero__world" ref={box}>
        <canvas
          ref={canvas}
          className="bl-hero__canvas"
          tabIndex={placed ? 0 : -1}
          role="application"
          aria-roledescription="world"
          aria-label={`A world at night with ${place.title} by ${place.by} at ${xyz(place.coords)}.${placed ? ' Arrow keys move the cursor, Enter places a block, Delete breaks one, 1 to 6 pick a block.' : ''}`}
          data-mode={mode}
          onPointerMove={onMove}
          onPointerLeave={() => setCursor(null)}
          onPointerDown={onDown}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={onKey}
        />
        <div className="bl-hero__tag" style={tagStyle} hidden={!canDraw}>
          <p className="bl-hero__frame" ref={caption} tabIndex={-1}>
            <span>{place.title}</span>
            <span className="bl-hero__by">by {place.by}</span>
          </p>
          <div className="bl-hero__place" data-ready={ready ? '' : undefined}>
            {ready ? (
              <>
                <span className="bl-hero__arrow" aria-hidden="true" />
                <span className="bl-hero__prompt">Place the last block</span>
                <Button size="sm" onClick={placeBlock} title="Or press Enter">
                  Place block
                </Button>
              </>
            ) : placed && !building ? (
              <span className="bl-hero__done">
                Built. {total} blocks at {xyz(place.coords)}.
              </span>
            ) : (
              <span className="bl-hero__done">{phase === 'dissolve' ? 'Teleporting…' : `Placing blocks ${pct}%`}</span>
            )}
          </div>
        </div>
        <div className="bl-hud bl-hero__hud bl-hero__hud--tl" ref={hud}>
          <span>Blockfeed · fan site</span>
          <span>
            Seed <strong data-decode={place.seed}>{place.seed}</strong>
          </span>
          <span data-decode={xyz(place.coords, ' · ')}>{xyz(place.coords, ' · ')}</span>
        </div>
        <div className="bl-hud bl-hero__hud bl-hero__hud--tr">
          <span>Week 43 challenge</span>
          <span>Voting ends in 2d 14h</span>
        </div>
        {canDraw ? null : (
          <div className="bl-hero__poster">
            <InlineMessage tone="info" title="This browser can’t draw the world">
              {place.title} by {place.by} is at {xyz(place.coords)}, seed {place.seed}. Everything else on the page works.
            </InlineMessage>
          </div>
        )}
      </div>

      {placed && canDraw ? (
        <div className="bl-hero__tools" role="group" aria-label="Build in the world">
          <div className="bl-hero__bar" role="radiogroup" aria-label="Block to place">
            {PALETTE.map((p, i) => (
              <button
                key={p.b}
                type="button"
                role="radio"
                aria-checked={tool === p.b}
                className="bl-hero__block"
                data-block={p.b}
                onClick={() => {
                  setTool(p.b)
                  setMode('place')
                }}
                title={`${p.label} (${i + 1})`}
              >
                <span className="bl-hero__swatch" aria-hidden="true" />
                <span className="bf-sr">{p.label}</span>
                <span className="bl-hero__key" aria-hidden="true">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
          <Button size="sm" aria-pressed={mode === 'break'} onClick={() => setMode((m) => (m === 'break' ? 'place' : 'break'))}>
            {mode === 'break' ? 'Breaking' : 'Break'}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} disabled={edits.size === 0}>
            Reset world
          </Button>
          <p className="bl-hero__hint">Click to place · Shift-click or right-click to break · 1–6 pick a block</p>
        </div>
      ) : null}

      <div className="bl-hero__panel">
        <h1 id="hero-title" className="bl-hero__title">
          Every build has an address.
        </h1>
        <p className="bl-hero__sub">Post your builds with their seed and coordinates, vote in the weekly challenge, and find a server to play on.</p>
        <div className="bl-row bl-hero__actions">
          <Button variant="primary" size="lg" onClick={scrollToSignup}>
            Create free account
          </Button>
          <a className="bl-hero__browse" href="#builds">
            Browse builds, no account needed
          </a>
        </div>
        <p className="bl-hero__note">Free. An unofficial fan site for Minecraft builders. Not affiliated with Mojang or Microsoft.</p>
      </div>
    </section>
  )
}
