/**
 * The live cake (COMPONENTS.md §Cake stand), lazy: three.js through @react-three/fiber, loaded after first paint and
 * never the LCP element. Tiers are set down onto the one below when added ('stack', damped, no bounce), the stand
 * sways to show its side and back to the front over 5 s, stopping on any input ('turn'), and the rotate buttons (in CakeStand) turn it by 45°.
 * Under reduced motion it renders still frames: no idle turn, tiers appear in place.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { useEffect, useMemo, useRef, type JSX } from 'react'
import * as THREE from 'three'
import { prefersReducedMotion } from '../motion'
import { TIER_SIZES, type Design } from './data'

const IN = 0.1 // scene units per inch
const TIER_H = 4 * IN
const IDLE_MS = 5000
const FOOT = 0.44 // the stand's foot, below the board
const FOV = 30

/** A fixed cake colour from tokens.css (--cake-*): the same in both themes. */
function token(name: `--cake-${string}`): string {
  if (typeof window === 'undefined') return 'white'
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'white'
}

function finishColor(finish: Design['finish']): string {
  if (finish === 'naked' || finish === 'semi-naked') return token('--cake-crumb')
  if (finish === 'buttercream') return token('--cake-buttercream')
  return token('--cake-fondant')
}

function TierMesh({ size, y, shape, color, isNew }: { size: number; y: number; shape: Design['shape']; color: string; isNew: boolean }): JSX.Element {
  const group = useRef<THREE.Group>(null)
  const start = useRef(isNew && !prefersReducedMotion() ? y + 0.35 : y)
  useEffect(() => {
    if (group.current) group.current.position.y = start.current
  }, [])
  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    g.position.y += (y - g.position.y) * (1 - Math.exp(-10 * dt)) // damped set-down, never overshoots
  })
  const r = (size / 2) * IN
  const beads = useMemo(() => {
    const n = Math.round((2 * Math.PI * r) / 0.018)
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      return [Math.cos(a) * (r + 0.002), 0.008, Math.sin(a) * (r + 0.002)] as const
    })
  }, [r])
  return (
    <group ref={group}>
      <mesh castShadow receiveShadow position={[0, TIER_H / 2, 0]}>
        {shape === 'square' ? (
          <boxGeometry args={[r * 1.8, TIER_H, r * 1.8]} />
        ) : (
          <cylinderGeometry args={[r, r, TIER_H, shape === 'hexagon' ? 6 : 96]} />
        )}
        <meshPhysicalMaterial color={color} roughness={0.42} sheen={0.55} sheenRoughness={0.35} sheenColor={token('--cake-bead')} clearcoat={0.08} clearcoatRoughness={0.6} />
      </mesh>
      {shape === 'round'
        ? beads.map((p, i) => (
            <mesh key={i} position={p as unknown as [number, number, number]}>
              <sphereGeometry args={[0.007, 8, 6]} />
              <meshStandardMaterial color={token('--cake-bead')} roughness={0.4} />
            </mesh>
          ))
        : null}
    </group>
  )
}

/**
 * The rose rings, inside out: petals per ring, distance from the heart, petal size, how far the ring has opened
 * (0: wrapped round the bud, toward 1.2: lying open to the viewer) and how far forward it sits.
 */
const ROSE = [
  { n: 3, r: 0.006, size: 0.016, open: 0.25, z: 0.03 },
  { n: 5, r: 0.014, size: 0.022, open: 0.6, z: 0.022 },
  { n: 7, r: 0.024, size: 0.028, open: 1.05, z: 0.012 },
] as const

/**
 * A sugar rose: three rings of cupped petals (shallow sphere-cap shells, as the rendered flowers are built) round a
 * closed bud, facing out from the cake along +z of its group. The inner rings wrap the bud; the outer ring lies open.
 */
function Flower({ position, turn = 0, color, scale = 1, leaf }: { position: [number, number, number]; turn?: number; color: string; scale?: number; leaf?: boolean }): JSX.Element {
  return (
    <group position={position} rotation={[0, turn, 0]} scale={scale}>
      {ROSE.flatMap((ring, k) =>
        Array.from({ length: ring.n }, (_, i) => {
          const a = (i / ring.n) * Math.PI * 2 + k * 0.7
          return (
            <group key={`${k}-${i}`} rotation={[0, 0, a]}>
              <mesh position={[0, ring.r, ring.z]} rotation={[-ring.open, 0, 0]} castShadow>
                <sphereGeometry args={[ring.size, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
                <meshPhysicalMaterial color={color} roughness={0.7} sheen={0.7} sheenColor={token('--cake-bead')} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )
        }),
      )}
      <mesh position={[0, 0, 0.034]} scale={[1, 1, 1.3]}>
        <sphereGeometry args={[0.009, 14, 10]} />
        <meshPhysicalMaterial color={color} roughness={0.7} sheen={0.7} sheenColor={token('--cake-bead')} />
      </mesh>
      {leaf ? (
        <mesh position={[0.058, -0.03, 0.002]} rotation={[0, 0, -0.6]} scale={[1, 0.42, 0.18]}>
          <sphereGeometry args={[0.04, 14, 10]} />
          <meshStandardMaterial color={token('--cake-leaf')} roughness={0.6} />
        </mesh>
      ) : null}
    </group>
  )
}

/** Where a flower sits on a tier's face at angle `a` (0 faces the camera), pushed just clear of the icing. */
function onFace(shape: Design['shape'], r: number, a: number, y: number, lift = 0.012): { position: [number, number, number]; turn: number } {
  const s = Math.sin(a)
  const c = Math.cos(a)
  const reach = shape === 'square' ? (r * 0.9) / Math.max(Math.abs(s), Math.abs(c)) : shape === 'hexagon' ? r * 0.92 : r
  return { position: [s * (reach + lift), y, c * (reach + lift)], turn: a }
}

/** Fits the whole cake and stand in the frame at any aspect ratio; damped, so adding a tier eases the view back. */
/** The gold-leaf flakes, fixed (a seeded scatter): x, y on the tier face, size, corners, turn. */
const FLAKES = Array.from({ length: 18 }, (_, i) => {
  const r = (k: number): number => {
    const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
    return v - Math.floor(v)
  }
  const spread = 0.6 + r(1) * 0.4
  return { x: (r(2) - 0.5) * 0.13 * spread, y: (r(3) - 0.5) * 0.08 * spread, s: 0.006 + r(4) * 0.012, n: 5 + Math.floor(r(5) * 3), r: r(6) * Math.PI }
})

function Framing({ height, width }: { height: number; width: number }): null {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3())
  useFrame((_, dt) => {
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const aspect = size.width / Math.max(1, size.height)
    // room for the widest tier and the flowers standing off it at every angle of the turn
    const dist = Math.max((height * 0.58) / half, (width * 0.74) / (half * aspect)) + width / 2
    const cy = (height - FOOT * 2) / 2
    const k = 1 - Math.exp(-6 * dt)
    camera.position.lerp(new THREE.Vector3(0, cy + dist * 0.26, dist), k)
    look.current.lerp(new THREE.Vector3(0, cy, 0), k)
    camera.lookAt(look.current)
  })
  return null
}
function Cake({ design, angle, idle }: { design: Design; angle: number; idle: boolean }): JSX.Element {
  const root = useRef<THREE.Group>(null)
  const spin = useRef(0)
  const started = useRef(performance.now())
  const prevSizes = useRef<readonly number[]>([])
  const sizes = TIER_SIZES[design.tiers] ?? TIER_SIZES[3]
  const before = prevSizes.current
  useEffect(() => {
    prevSizes.current = sizes
  })
  const color = finishColor(design.finish)
  const petals = [token('--cake-petal-1'), token('--cake-petal-2'), token('--cake-petal-3')]
  // any input (a turn button or a change to the design) ends the idle sway at once
  const input = `${angle}|${design.tiers}|${design.shape}|${design.finish}|${design.flowers}|${design.goldLeaf}`
  const firstInput = useRef(input)
  const stopped = useRef(false)
  useEffect(() => {
    if (input !== firstInput.current) stopped.current = true
  }, [input])
  useFrame((_, dt) => {
    const g = root.current
    if (!g) return
    // the idle sway shows the side and comes back to face the front within 5 s (no pause control needed)
    const p = (performance.now() - started.current) / IDLE_MS
    spin.current = idle && !stopped.current && p < 1 ? 0.9 * Math.sin(Math.PI * p) ** 2 : 0
    const target = angle + spin.current
    g.rotation.y += (target - g.rotation.y) * (1 - Math.exp(-8 * dt))
  })
  // bottom tier first
  let y = 0.03
  const tiers = [...sizes].reverse().map((size) => {
    const at = y
    y += TIER_H
    return { size, y: at }
  })
  const top = y
  const standR = (sizes[sizes.length - 1] / 2 + 1.5) * IN
  const middle = tiers[Math.floor(tiers.length / 2)]
  const leaf = onFace(design.shape, (middle.size / 2) * IN, 0.35, middle.y + TIER_H * 0.55, 0.002)
  return (
    <group ref={root}>
      <Framing height={top + FOOT} width={standR * 2} />
      {/* the stand */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[(sizes[sizes.length - 1] / 2 + 1.5) * IN, (sizes[sizes.length - 1] / 2 + 1.5) * IN, 0.03, 96]} />
        <meshStandardMaterial color={token('--cake-stand')} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.1, 0.28, 0.44, 64]} />
        <meshStandardMaterial color={token('--cake-stand')} roughness={0.3} />
      </mesh>
      {tiers.map((t) => (
        <TierMesh key={t.size} size={t.size} y={t.y} shape={design.shape} color={color} isNew={before.length > 0 && !before.includes(t.size)} />
      ))}
      {design.flowers === 'cascade'
        ? tiers.flatMap((t, i) => {
            // a ribbon of flowers falling from the top tier's right shoulder to the base on the left
            const r = (t.size / 2) * IN
            const along = tiers.length > 1 ? i / (tiers.length - 1) : 0
            return [0, 1, 2].map((k) => {
              const at = onFace(design.shape, r, -0.55 + along * 0.9 + (k - 1) * 0.28, t.y + TIER_H * (0.82 - k * 0.3))
              return <Flower key={`c-${t.size}-${k}`} {...at} color={petals[(i + k) % 3]} scale={k === 1 ? 2.3 : 1.6} leaf={k !== 1} />
            })
          })
        : null}
      {design.flowers === 'spray'
        ? [0, 1, 2, 3].map((k) => {
            const t = tiers[tiers.length - 1]
            const at = onFace(design.shape, (t.size / 2) * IN, -0.35 + k * 0.24, t.y + TIER_H * (k % 2 ? 0.95 : 0.7))
            return <Flower key={`s-${k}`} {...at} color={petals[k % 3]} scale={k === 1 ? 2.2 : 1.6} leaf={k % 2 === 0} />
          })
        : null}
      {design.flowers === 'crown'
        ? [0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k / 6) * Math.PI * 2
            return <Flower key={`crown-${k}`} position={[Math.sin(a) * 0.13, top + 0.035, Math.cos(a) * 0.13]} turn={a} color={petals[k % 3]} scale={1.8} leaf />
          })
        : null}
      {design.goldLeaf ? (
        <group position={leaf.position} rotation={[0, leaf.turn, 0]}>
          {/* pressed gold leaf: torn flakes, denser at the centre, as on the rendered cake; the studio light gives the
              metal something to reflect, so it can be fully gold */}
          {FLAKES.map((f, i) => (
            <mesh key={i} position={[f.x, f.y, 0]} rotation={[0, 0, f.r]}>
              <circleGeometry args={[f.s, f.n]} />
              <meshStandardMaterial color={token('--cake-gold')} metalness={0.85} roughness={0.32} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  )
}

export interface Cake3DProps {
  design: Design
  /** Turned by the rotate buttons, in radians. */
  angle: number
  onReady: () => void
}

export default function Cake3D({ design, angle, onReady }: Cake3DProps): JSX.Element {
  const idle = !prefersReducedMotion()
  return (
    <Canvas
      className="ms-stand__gl"
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [0, 0.9, 3.4], fov: FOV }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}
      onCreated={() => onReady()}
      frameloop="always"
      aria-hidden="true"
      style={{ touchAction: 'pan-y' }}
    >
      {/* a soft window key from the left, warm bounce from the stand, a cool rim: the fondant reads white, not grey */}
      {/* a soft studio of light panels (no file to download): the satin highlights the rendered cakes have */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[-3, 2.2, 3]} scale={[4, 3, 1]} color="#fff4e6" target={[0, 0.6, 0]} />
        <Lightformer form="rect" intensity={0.9} position={[3.2, 1.2, 2]} scale={[3, 3, 1]} color="#fff8f0" target={[0, 0.6, 0]} />
        <Lightformer form="ring" intensity={1.4} position={[0, 4, -2.5]} scale={2} color="#fff2e2" target={[0, 0.6, 0]} />
        <Lightformer form="rect" intensity={0.5} position={[0, -1, 3]} scale={[6, 1, 1]} color="#f3e7d2" target={[0, 0.6, 0]} />
      </Environment>
      <hemisphereLight args={[token('--cake-bead'), token('--cake-shade'), 0.45]} />
      <directionalLight position={[-2.5, 3, 2.5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[2.5, 1.2, 1.5]} intensity={0.5} />
      <directionalLight position={[0, 2, -3]} intensity={0.6} />
      <Cake design={design} angle={angle} idle={idle} />
    </Canvas>
  )
}
