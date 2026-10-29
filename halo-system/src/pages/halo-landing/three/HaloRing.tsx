/**
 * The halo: a ring of light drawn in the studio around the watch, in the watch's own plane, the page's signature
 * (CONCEPT.md thread; critique round 1, A1). Its arc is the visitor's way through the page: a short start with a
 * bright head in the hero, a step per layer, per moment and for the build, and closed once the pre-order is placed.
 * A thin core in signal orange, a soft glow that falls off on the stage, and a brighter head at the
 * arc's leading end. The ring is built once, clockwise from twelve o'clock; the arc is only its draw range, so a
 * moving arc costs nothing per frame.
 */
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type JSX } from 'react'
import { BufferAttribute, CanvasTexture, Color, DoubleSide, type Group, type Mesh, MeshBasicMaterial, NoColorSpace, RingGeometry } from 'three'

/** The ring's radius around the case (units of 10 mm), its core width and its glow width. */
const R = 4.15
const CORE = 0.045
const GLOW = 0.75
const SEGMENTS = 256
const ORANGE = new Color('#ff5a1f')

/** A white-to-black radial band centred on the ring's radius: the glow's alpha (white opaque, black clear). */
function glowTexture(): CanvasTexture {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d') as CanvasRenderingContext2D
  g.fillStyle = '#000'
  g.fillRect(0, 0, size, size)
  // RingGeometry's UVs map x / outer radius onto 0-1: the ring sits at R / (R + GLOW) of the half width
  const outer = R + GLOW
  const px = (r: number): number => (r / outer) * (size / 2)
  const grad = g.createRadialGradient(size / 2, size / 2, px(R - GLOW), size / 2, size / 2, px(outer))
  // a soft bell, near the core and gone well before the band's edges, so the glow never reads as a band
  const bell = [0, 0.22, 0.34, 0.42, 0.47, 0.5, 0.53, 0.58, 0.66, 0.78, 1]
  for (const at of bell) {
    const v = Math.round(160 * Math.exp(-(((at - 0.5) / 0.09) ** 2)))
    grad.addColorStop(at, `rgb(${v},${v},${v})`)
  }
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const t = new CanvasTexture(c)
  t.colorSpace = NoColorSpace
  return t
}

export interface HaloRingProps {
  /** 0-1: how much of the ring is lit. */
  progress: { current: number }
  /** Where the ring sits along the case axis (it follows the teardown's stack). */
  lift: { current: number }
  /** 0-1: how strong the glow is (lower on the paper stage, where additive light reads less). */
  glow: { current: number }
  /** The ring's size against its full radius: the hero draws it closer round the case, so it shows in the crop. */
  radius: { current: number }
}

/** How much of the ring the glow takes to fade in from twelve o'clock, and to fade out behind the head. */
const FADE_START = 0.1
const FADE_HEAD = 0.035

export function HaloRing({ progress, lift, glow, radius }: HaloRingProps): JSX.Element {
  const root = useRef<Group>(null)
  const core = useRef<Mesh>(null)
  const halo = useRef<Mesh>(null)
  const head = useRef<Mesh>(null)
  const tex = useMemo(() => glowTexture(), [])
  // the whole ring, built once, running clockwise from twelve o'clock (a negative sweep); one segment is 6 indices
  const geo = useMemo(() => ({ core: new RingGeometry(R - CORE, R + CORE, SEGMENTS, 1, Math.PI / 2, -Math.PI * 2), halo: new RingGeometry(R - GLOW, R + GLOW, SEGMENTS, 1, Math.PI / 2, -Math.PI * 2) }), [])
  // the glow's alpha along the arc (vertex alpha, white): faded in from the start and out at the head, so the arc
  // never ends on a hard cut; rewritten only when the lit length changes
  const fade = useMemo(() => {
    const count = geo.halo.attributes.position.count
    const attr = new BufferAttribute(new Float32Array(count * 4).fill(1), 4)
    geo.halo.setAttribute('color', attr)
    return { attr, n: -1 }
  }, [geo])
  const mats = useMemo(
    () => ({
      core: new MeshBasicMaterial({ color: ORANGE.clone().multiplyScalar(1.4), toneMapped: false, side: DoubleSide }),
      // the glow is real transparency (an alpha falloff), not additive light: additive light on a transparent canvas
      // only reads over a dark ground and smears dark over a light one
      glow: new MeshBasicMaterial({ alphaMap: tex, color: ORANGE, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: DoubleSide }),
      head: new MeshBasicMaterial({ color: new Color('#ffd2b8'), toneMapped: false }),
    }),
    [tex],
  )
  useEffect(
    () => () => {
      tex.dispose()
      Object.values(mats).forEach((m) => m.dispose())
      geo.core.dispose()
      geo.halo.dispose()
    },
    [tex, mats, geo],
  )

  useFrame(() => {
    const p = Math.max(0.002, Math.min(1, progress.current))
    const z = lift.current
    root.current?.scale.set(radius.current, radius.current, 1)
    for (const m of [core.current, halo.current, head.current]) if (m) m.position.z = z
    mats.glow.opacity = glow.current
    // the arc is the draw range: the first n segments of the ring, clockwise from twelve o'clock
    const n = Math.max(1, Math.round(SEGMENTS * p))
    geo.core.setDrawRange(0, n * 6)
    geo.halo.setDrawRange(0, n * 6)
    if (n !== fade.n) {
      fade.n = n
      const a = fade.attr.array as Float32Array
      const ring = SEGMENTS + 1
      const closed = p >= 0.999
      for (let j = 0; j < ring; j++) {
        const f = j / SEGMENTS
        const lit = n / SEGMENTS
        const v = closed ? 1 : Math.min(1, f / FADE_START, Math.max(0, (lit - f) / FADE_HEAD))
        a[j * 4 + 3] = v
        a[(ring + j) * 4 + 3] = v
      }
      fade.attr.needsUpdate = true
    }
    if (head.current) {
      const a = Math.PI / 2 - p * Math.PI * 2
      head.current.visible = p < 0.999
      head.current.position.set(Math.cos(a) * R, Math.sin(a) * R, z)
      head.current.scale.set(1 / radius.current, 1 / radius.current, 1)
    }
  })

  return (
    <group ref={root}>
      <mesh ref={halo} geometry={geo.halo} material={mats.glow} renderOrder={4} frustumCulled={false} />
      <mesh ref={core} geometry={geo.core} material={mats.core} renderOrder={5} frustumCulled={false} />
      <mesh ref={head} material={mats.head} renderOrder={6}>
        <sphereGeometry args={[0.09, 16, 12]} />
      </mesh>
    </group>
  )
}
