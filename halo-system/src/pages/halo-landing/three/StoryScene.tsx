/**
 * The story canvas (MOTION.md Plan): one transparent WebGL canvas, held behind the hero, the teardown and the worn
 * moments, over the page's own stage colour. The director reads the shared `story` every frame and sets the camera,
 * the turn, the layers, the face, the band, the wrist, the drops and the light; React never re-renders on scroll.
 * Lazy: this file and three.js load after first paint (Page.tsx).
 */
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type JSX } from 'react'
import { MathUtils, type Group, type PerspectiveCamera, Vector3 } from 'three'
import { BANDS, FACES } from '@/system/halo'
import { durationMs } from '@/system/motion'
import { smooth, story } from '../story'
import { HaloWatch, type WatchLook } from './HaloWatch'
import type { FaceMode, FaceState } from './face'
import { Studio, type Mood, type Stage } from './Studio'
import { HaloRing } from './HaloRing'
import { Drops, WristForm } from './Worn'

/** One full sway of the hero turntable, in seconds (MOTION.md Token extensions, `swayPeriod`). */
const SWAY_PERIOD = 24
const MOMENTS: readonly FaceMode[] = ['run', 'sleep', 'swim', 'notify']
const METAL = { natural: '#c4c6c9', black: '#3a3c40' } as const

interface Shot {
  yaw: number
  pitch: number
  dist: number
  target: [number, number, number]
  /** Where the watch sits in the frame: a share of the width to the right (desktop), of the height upward (phone). */
  dx: number
  dy: number
}

const mix = (a: Shot, b: Shot, t: number): Shot => ({
  yaw: MathUtils.lerp(a.yaw, b.yaw, t),
  pitch: MathUtils.lerp(a.pitch, b.pitch, t),
  dist: MathUtils.lerp(a.dist, b.dist, t),
  target: [MathUtils.lerp(a.target[0], b.target[0], t), MathUtils.lerp(a.target[1], b.target[1], t), MathUtils.lerp(a.target[2], b.target[2], t)],
  dx: MathUtils.lerp(a.dx, b.dx, t),
  dy: MathUtils.lerp(a.dy, b.dy, t),
})

/** A step that cuts under reduced motion: 0 or 1 at the step's end, never in between. */
const cut = (x: number, reduced: boolean): number => (reduced ? (x >= 1 ? 1 : 0) : smooth(x))

/** The hero's ring against its full radius: close round the case, inside the hero's crop. */
const HERO_RING = 0.74

function Director(): JSX.Element {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const turn = useRef<Group>(null)
  const explode = useRef(0)
  const look = useRef<WatchLook>({ metal: METAL.natural, band: '#ff5a1f' })
  const face = useRef<FaceState>({ mode: 'time', t: 1, ring: 0.62 })
  const band = useRef(1)
  const wrist = useRef(0)
  const drops = useRef(0)
  const mood = useRef<Mood>({ night: 0, pool: 0 })
  const swayClock = useRef(0)
  const yaw = useRef(0)
  const aim = useRef(new Vector3())
  // the configurator's settle: a short dip and rest each time the build changes (MOTION.md S4, `settle`)
  const settle = useRef(0)
  const lastBuild = useRef(story.build)
  const scale = useRef(1)
  // the halo ring: how much is lit, where it sits on the case axis, how strong its glow is
  const ring = useRef(0)
  const ringLift = useRef(0.3)
  const ringGlow = useRef(1)
  const ringRadius = useRef(HERO_RING)
  // the configurator's dial: the model's side dial turns one notch a detent
  const dial = useRef(0)
  const lastFace = useRef(0)
  // phones: the free height between the header and the hero's words, measured, so the case always fits above them
  const heroRoom = useRef<{ top: number; bottom: number } | null>(null)
  useEffect(() => {
    const measure = (): void => {
      const copy = document.querySelector('.hero__copy')
      const header = document.querySelector('.halo__header')
      if (!copy || !header) return
      const top = header.getBoundingClientRect().bottom
      const bottom = copy.getBoundingClientRect().top + window.scrollY - (window.scrollY > 0 ? 0 : 0)
      heroRoom.current = { top, bottom }
    }
    measure()
    window.addEventListener('resize', measure)
    void document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useFrame((_, dt) => {
    const s = story
    // side by side from 1024 px; below it the watch sits above the words (page.css uses the same break)
    const wide = size.width >= 1024
    // keep the watch's share of the frame as the window narrows: pull the camera back on tall frames
    // short phone screens (320 × 568) give the words more of the height: the camera steps back further there
    const fit = wide ? Math.max(1, 1.55 / (size.width / size.height)) : Math.max(1, 0.62 / (size.width / size.height)) * Math.max(1, 760 / size.height)
    const reduced = s.reduced
    const e2 = cut(s.enter2, reduced)
    const e3 = cut(s.enter3, reduced)
    const e4 = cut(s.enter4, reduced)

    // the hero turn: a slow sway (paused, dragging or reduced: none), plus where the visitor turned it
    if (!s.paused && !reduced && !s.dragging && e2 < 1) swayClock.current += dt
    const sway = reduced ? 0 : Math.sin((swayClock.current / SWAY_PERIOD) * Math.PI * 2) * (wide ? 0.31 : 0.21)
    yaw.current += (s.yawTarget - yaw.current) * (1 - Math.exp(-dt * (s.dragging ? 14 : 5)))
    if (s.build !== lastBuild.current || s.faceIndex !== lastFace.current) {
      lastBuild.current = s.build
      lastFace.current = s.faceIndex
      if (!reduced) settle.current = 1
    }
    dial.current = -s.faceIndex * (Math.PI / 6)
    settle.current = Math.max(0, settle.current - dt / (durationMs.scene / 1000))
    const sizeTarget = s.build.size === '41' ? 41 / 45 : 1
    scale.current = reduced ? sizeTarget : MathUtils.lerp(scale.current, sizeTarget, 1 - Math.exp(-dt * 5))
    if (turn.current) {
      // the hero's turn, square-on through the teardown and on the wrist, then the configurator's three-quarter view
      turn.current.rotation.y = MathUtils.lerp(MathUtils.lerp(-0.42 + yaw.current + sway, 0, e2), -0.5, e4)
      turn.current.rotation.x = MathUtils.lerp(MathUtils.lerp(0.12, 0, e2), 0.1, e4)
      turn.current.position.y = -0.35 * settle.current * settle.current * e4
      turn.current.scale.setScalar(scale.current)
    }

    // the teardown: one layer per step; under reduced motion each step shows its finished lift
    const step = Math.min(4, Math.floor(s.tear))
    const tear = reduced ? (s.enter2 >= 1 ? Math.min(5, step + 1) : 0) : s.tear
    explode.current = tear * (1 - e3)
    band.current = Math.max(1 - e2, e3, e4)
    wrist.current = e3 * (1 - e4)

    // the face: the hero's Time face, the ring counting the layers, then the four moments on the wrist
    if (e3 >= 0.5 && e4 < 0.5) {
      const m = Math.max(0, Math.min(3, Math.floor(s.moment)))
      const t = reduced ? 1 : s.moment - m
      // the face redraws (and re-uploads) only on 1/24 steps of its moment, not on every scroll frame
      const q = Math.round(t * 24) / 24
      face.current = { mode: MOMENTS[m], t: m === 0 ? q * 0.8 : q }
      const inStep = (k: number, x: number): number => (reduced ? (m === k ? 1 : 0) : s.moment < k ? 0 : s.moment < k + 1 ? smooth(x * 3) : 1 - smooth((s.moment - k - 1) * 3))
      mood.current.night = inStep(1, s.moment - 1) * e3 * (1 - e4)
      mood.current.pool = inStep(2, s.moment - 2) * e3 * (1 - e4)
      // the drops bead on the glass through the pool and run off before it ends, so the message arrives on dry glass
      drops.current = m === 2 ? (reduced ? 1 : smooth(t * 2.5) * (1 - smooth((t - 0.72) * 4))) : 0
    } else if (e4 >= 0.5 && s.faceIndex > 0) {
      // the configurator's dial chose a face: one reading on the model
      const f = FACES[s.faceIndex]
      face.current = { mode: 'figure', t: 1, value: f.value, unit: f.unit, ring: f.ring }
      mood.current.night = 0
      mood.current.pool = 0
      drops.current = 0
    } else {
      face.current = { mode: 'time', t: 1, ring: e2 >= 1 && e4 < 0.5 ? 0.2 * (step + 1) : 0.62 }
      mood.current.night = 0
      mood.current.pool = 0
      drops.current = 0
    }

    // the build chosen in S4 rides along
    look.current.metal = METAL[s.build.finish]
    look.current.band = BANDS.find((b) => b.id === s.build.band)?.hex ?? '#ff5a1f'

    // the camera: three shots, blended by the story; the watch placed in the frame with a view offset
    const tp = Math.min(1, tear / 5)
    // the hero crops the watch hard: the case fills most of the frame's height and the band runs off top and bottom
    const hero: Shot = { yaw: 0.18, pitch: 0.12, dist: wide ? 13.2 : 29, target: [0, 0.1, 0], dx: wide ? 0.2 : -0.17, dy: wide ? 0 : 0.3 }
    if (!wide && heroRoom.current) {
      // the case (4.5 units) takes 62% of the free height, set a little high in it, so the band's lower curl clears
      // the headline (the upper band may run off the top)
      const { top, bottom } = heroRoom.current
      const room = Math.max(120, bottom - top)
      const unitsTall = (4.5 * size.height) / (0.62 * room)
      hero.dist = unitsTall / (2 * Math.tan((15 * Math.PI) / 180)) / fit
      hero.dy = (size.height / 2 - (top + room * 0.44)) / size.height
    }
    const teardown: Shot = reduced
      ? { yaw: 0.9, pitch: 0.28, dist: wide ? 25 : 31, target: [0, 0, 1.8], dx: wide ? 0.13 : 0, dy: wide ? 0 : 0.16 }
      : { yaw: 0.5 + 0.72 * tp, pitch: 0.22 + 0.1 * tp, dist: (wide ? 21 : 27) + 4 * tp, target: [0, 0, 2.3 * tp], dx: wide ? 0.13 : 0, dy: wide ? 0 : 0.16 }
    // no drift through the moments: a turning camera walks the sapphire's reflection onto the key softbox
    const drift = 0
    // mirrored: the wrist sits left of centre, the words take the right column (the teardown and the configurator
    // keep the words on the left), and the forearm runs the other diagonal
    // full-bleed: the watch centred and large on the wrist form, the arm across the whole frame, the words a caption
    const worn: Shot = { yaw: 0.36 + drift, pitch: 0.36, dist: wide ? 23.5 : 30, target: [0, 0, -1.2], dx: wide ? 0.09 : 0, dy: 0.17 }
    const design: Shot = { yaw: 0.22, pitch: 0.14, dist: wide ? 22 : 30, target: [0, 0, 0], dx: wide ? 0.21 : 0, dy: wide ? 0 : 0.26 }
    const shot = mix(mix(mix(hero, teardown, e2), worn, e3), design, e4)
    shot.dist *= fit
    const cp = Math.cos(shot.pitch)
    aim.current.set(...shot.target)
    camera.position.set(aim.current.x + Math.sin(shot.yaw) * cp * shot.dist, aim.current.y + Math.sin(shot.pitch) * shot.dist, aim.current.z + Math.cos(shot.yaw) * cp * shot.dist)
    // on the wrist the frame rolls a little, so the forearm runs across it on a diagonal, as when you raise it to look
    const roll = -0.34 * e3 * (1 - e4)
    camera.up.set(Math.sin(roll), Math.cos(roll), 0)
    camera.lookAt(aim.current)
    // the halo's arc is the way through the 3D story: empty in the hero (only its bright head at twelve o'clock), a step
    // per layer (5) and per moment (4), and closed by the configurator, the last 3D scene (the person, 2026-10-29: a
    // ring that reads as progress must finish where the story does); it stays closed once the pre-order is placed.
    // It rides with the teardown's stack and glows less on paper
    const STEPS = 10
    const target = s.ordered
      ? 1
      : e4 > 0
        ? MathUtils.lerp(9 / STEPS, 1, e4)
        : e3 > 0
          ? MathUtils.lerp(5 / STEPS, (5 + (reduced ? Math.min(4, Math.floor(s.moment) + 1) : Math.min(4, s.moment))) / STEPS, e3)
          : e2 > 0
            ? MathUtils.lerp(0, Math.min(5, tear) / STEPS, e2)
            : 0
    ring.current = reduced ? target : ring.current + (target - ring.current) * (1 - Math.exp(-dt * 6))
    ringLift.current = 0.35 + 2.3 * tp * (1 - e3)
    // the glow is an alpha falloff, so it reads on both stages; on paper it is quieter
    ringGlow.current = s.enter2 >= 1 && s.enter3 < 1 ? 0.55 : 1
    // in the hero the ring draws in close round the case, so its start and bright head sit inside the crop
    ringRadius.current = MathUtils.lerp(HERO_RING, 1, e2)
    const w = size.width, h = size.height
    camera.setViewOffset(w, h, -shot.dx * w, shot.dy * h, w, h)
  })

  return (
    <>
      <group ref={turn}>
        <HaloWatch explode={explode} look={look} face={face} band={band} dial={dial} />
        <HaloRing progress={ring} lift={ringLift} glow={ringGlow} radius={ringRadius} />
        <Drops amount={drops} />
      </group>
      <WristForm show={wrist} />
      <MoodLink mood={mood} />
    </>
  )
}

/** Hands the director's mood to the studio's lights (they live outside the director's tree). */
const shared: { current: Mood } = { current: { night: 0, pool: 0 } }
function MoodLink({ mood }: { mood: { current: Mood } }): null {
  useFrame(() => {
    shared.current.night = mood.current.night
    shared.current.pool = mood.current.pool
  })
  return null
}

/** Calls `onReady` once the scene has drawn twice, so the poster gives way to a finished frame, never a blank one. */
function FirstFrames({ onReady }: { onReady?: () => void }): null {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 3) onReady?.()
  })
  return null
}

export interface StorySceneProps {
  stage: Stage
  frameloop: 'always' | 'never'
  onReady?: () => void
  onProgress?: (share: number) => void
  dpr: [number, number]
}

export default function StoryScene({ stage, frameloop, onReady, onProgress, dpr }: StorySceneProps): JSX.Element {
  return (
    <Studio stage={stage} camera={{ position: [3.4, 2.4, 19], fov: 30 }} frameloop={frameloop} transparent mood={shared} dpr={dpr} onProgress={onProgress} className="story__canvas">
      <Director />
      <FirstFrames onReady={onReady} />
    </Studio>
  )
}
