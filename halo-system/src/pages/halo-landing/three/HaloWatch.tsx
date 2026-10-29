/**
 * The HALO watch as a live three.js model (built from ./parts and ./innerParts, no model files). One group, five
 * layers that lift away from the case along its own axis when `explode` rises (0 = assembled, 1…5 = glass, the
 * display stack, the logic board, the cell lifted in turn, the hollow case alone at 5). Finish and band colours ease toward their targets every frame; the
 * face is a canvas texture redrawn only when its state changes.
 */
import { useFrame } from '@react-three/fiber'
import { use, useEffect, useMemo, useRef, type JSX } from 'react'
import { CatmullRomCurve3, Color, Group, MathUtils, Mesh, MeshBasicMaterial, Quaternion, SphereGeometry, Vector3 } from 'three'
import { createFace, type FaceState } from './face'
import { BoardParts, CellParts, DisplayParts, Pocket } from './Internals'
import { createInternalMaterials, shellGeometry } from './innerParts'
import { loadMaps } from './mapCache'
import { BAND_W, CASE, DISPLAY, bandGeometry, createMaterials, dialGeometry, lugGeometry, ringGeometry, slabGeometry } from './parts'

export interface WatchLook {
  /** Case metal colour (natural or black titanium). */
  metal: string
  /** Sport band colour. */
  band: string
}

export interface HaloWatchProps {
  /** 0 assembled … 5 every layer lifted (see the file comment). Read every frame from a ref, so scroll never re-renders. */
  explode: { current: number }
  look: { current: WatchLook }
  face: { current: FaceState }
  /** Dial turn in radians (the side dial's wheel). */
  dial?: { current: number }
  /** Show the band (hidden in the teardown, so the layers read). */
  band?: { current: number }
  size?: '41' | '45'
}

/** How far each layer travels along the case axis when fully lifted, front to back. */
const LIFT = [4.6, 3.45, 2.3, 1.15] as const
const SMOOTH = (x: number): number => x * x * (3 - 2 * x)

export function HaloWatch({ explode, look, face, dial, band, size = '45' }: HaloWatchProps): JSX.Element {
  // the page's shared surface maps, built off the main thread: the watch suspends until they arrive
  const maps = use(loadMaps())
  const m = useMemo(() => createMaterials(maps), [maps])
  const inner = useMemo(() => createInternalMaterials(maps), [maps])
  const faceTex = useMemo(() => createFace(), [])
  const geo = useMemo(() => {
    const top = [new Vector3(0, 2.2, -0.08), new Vector3(0, 3.1, -0.15), new Vector3(0, 4.2, -0.55), new Vector3(0, 5.05, -1.45), new Vector3(0, 5.35, -2.75), new Vector3(0, 5.2, -3.9)]
    const bottom = top.map((v) => new Vector3(0, -v.y, v.z))
    // pin holes on the outer face of the lower band, placed on its own curve so they sit flush at every bend
    const curve = new CatmullRomCurve3(bottom, false, 'centripetal')
    const side = new Vector3(1, 0, 0)
    const up = new Vector3(0, 1, 0)
    const holes = Array.from({ length: 8 }, (_, i) => {
      const u = 0.24 + i * 0.05
      const p = curve.getPointAt(u)
      const t = curve.getTangentAt(u)
      const n = new Vector3().crossVectors(t, side).normalize()
      if (n.z < 0 && p.z > -1) n.negate()
      return { position: p.clone().addScaledVector(n, 0.142), quaternion: new Quaternion().setFromUnitVectors(up, n) }
    })
    // the keeper: a short loop of silicone around the lower band, near its free end
    const keeper = Array.from({ length: 5 }, (_, i) => curve.getPointAt(0.66 + i * 0.022))
    return {
      holes,
      keeper: bandGeometry(keeper, BAND_W + 0.14, 0.46, 12),
      guard: slabGeometry(0.3, 0.26, 0.1, 0.72, 0.06),
      case: shellGeometry(),
      bezel: ringGeometry(DISPLAY.w + 0.22, DISPLAY.r + 0.11, DISPLAY.w - 0.02, DISPLAY.r - 0.01, 0.05, 0.012),
      glass: slabGeometry(DISPLAY.w, DISPLAY.w, DISPLAY.r, 0.11, 0.035),
      dial: dialGeometry(),
      lug: lugGeometry(0.42),
      bandTop: bandGeometry(top, BAND_W),
      bandBottom: bandGeometry(bottom, BAND_W),
      dome: new SphereGeometry(1.25, 64, 24, 0, Math.PI * 2, 0, 0.42),
      window: new SphereGeometry(0.16, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      slot: slabGeometry(0.3, 1.16, 0.1, 0.5, 0),
      button: slabGeometry(0.16, 0.62, 0.07, 0.34, 0.03),
    }
  }, [])

  const faceMat = useMemo(() => new MeshBasicMaterial({ map: faceTex.texture, toneMapped: false, transparent: true }), [faceTex])
  const halo = useMemo(() => ringGeometry(2.6, 1.3, 2.56, 1.28, 0.004, 0), [])
  const layers = useRef<(Group | null)[]>([])
  const bands = useRef<Group>(null)
  const dialRef = useRef<Mesh>(null)
  const target = useMemo(() => ({ metal: new Color(), band: new Color() }), [])

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => {
        if ('dispose' in g) g.dispose()
      })
      // materials only: their textures are the page's shared maps, kept for the next watch
      ;[...Object.values(m), ...Object.values(inner)].forEach((mat) => mat.dispose())
      faceTex.texture.dispose()
      faceMat.dispose()
      halo.dispose()
    },
    [geo, m, inner, faceTex, faceMat, halo],
  )

  useFrame((_, dt) => {
    const e = explode.current
    layers.current.forEach((g, i) => {
      if (!g) return
      const amount = SMOOTH(MathUtils.clamp(e - i, 0, 1))
      g.position.z = amount * (LIFT[i] ?? 0)
    })
    const k = 1 - Math.exp(-dt * 5)
    target.metal.set(look.current.metal)
    // silicone under a softbox reads lighter than its swatch: the model is dyed a step darker so it lands on the chip
    target.band.set(look.current.band).multiplyScalar(0.78)
    m.titanium.color.lerp(target.metal, k)
    m.brushed.color.lerp(target.metal.clone().offsetHSL(0, 0, 0.04), k)
    m.polished.color.lerp(target.metal.clone().offsetHSL(0, 0, 0.12), k)
    m.band.color.lerp(target.band, k)
    m.hole.color.copy(m.band.color).multiplyScalar(0.16)
    if (bands.current) {
      const show = band ? band.current : 1
      bands.current.visible = show > 0.01
      bands.current.scale.setScalar(MathUtils.lerp(0.001, 1, show))
    }
    if (dialRef.current && dial) dialRef.current.rotation.z = MathUtils.lerp(dialRef.current.rotation.z, dial.current, k)
    faceTex.draw(face.current)
    // the optical sensors glow only while the back is shown lifted
    m.sensorGreen.emissiveIntensity = MathUtils.lerp(m.sensorGreen.emissiveIntensity, e > 2.4 && e < 3.6 ? 1.1 : 0, k)
  })

  const zTop = CASE.d / 2
  const scale = size === '41' ? 41 / 45 : 1
  const set = (i: number) => (g: Group | null) => {
    layers.current[i] = g
  }

  return (
    <group scale={scale}>
      {/* 1. the sapphire glass and its polished bezel */}
      <group ref={set(0)}>
        <mesh geometry={geo.glass} material={m.glass} position={[0, 0, zTop + 0.06]} renderOrder={2} />
        <mesh geometry={geo.bezel} material={m.polished} position={[0, 0, zTop - 0.02]} />
      </group>
      {/* 2. the display: the OLED panel and the face it shows, with the fine halo ring */}
      <group ref={set(1)}>
        <DisplayParts m={inner} />
        <mesh material={faceMat} position={[0, 0, zTop + 0.03]}>
          <planeGeometry args={[DISPLAY.w - 0.24, DISPLAY.w - 0.24]} />
        </mesh>
        <mesh geometry={halo} material={m.polished} position={[0, 0, zTop + 0.034]} />
      </group>
      {/* 3. the logic board: system chip, memory, power, the radio under its shield, the optical heart-rate module */}
      <group ref={set(2)}>
        <BoardParts m={inner} led={m.sensorGreen} />
      </group>
      {/* 4. the cell: a lithium-polymer pouch with its tabs and protection board */}
      <group ref={set(3)}>
        <CellParts m={inner} protection={m.board} />
      </group>
      {/* 5. the case: a hollow shell with its pocket, lugs, the dial in its slot, the button, the sensor dome on the back */}
      <group>
        {/* the top and back faces brushed, the flanks and bevels blasted (the extrusion's two material groups) */}
        <mesh geometry={geo.case} material={[m.brushed, m.titanium]} castShadow receiveShadow />
        <Pocket m={inner} titanium={m.titanium} brushed={m.brushed} />
        {/* the lugs: two horns on each edge, the band running between them */}
        {[-1, 1].map((side) => (
          <group key={`lug${side}`}>
            <mesh geometry={geo.lug} material={m.titanium} position={[side * (BAND_W / 2 + 0.24), CASE.w / 2 - 0.16, 0]} castShadow />
            <mesh geometry={geo.lug} material={m.titanium} position={[side * (BAND_W / 2 + 0.24), -CASE.w / 2 + 0.16, 0]} rotation={[0, 0, Math.PI]} castShadow />
          </group>
        ))}
        <mesh geometry={geo.slot} material={m.recess} position={[CASE.w / 2 - 0.1, 0.25, 0]} />
        {/* crown guards: two shoulders of the case that frame the dial */}
        <mesh geometry={geo.guard} material={m.titanium} position={[CASE.w / 2 + 0.02, 0.25 + 0.72, 0]} castShadow />
        <mesh geometry={geo.guard} material={m.titanium} position={[CASE.w / 2 + 0.02, 0.25 - 0.72, 0]} castShadow />
        <mesh ref={dialRef} geometry={geo.dial} material={m.polished} position={[CASE.w / 2 - 0.36, 0.25, 0]} castShadow />
        <mesh position={[CASE.w / 2 + 0.2, 0.25, 0]} material={m.index}>
          <boxGeometry args={[0.03, 0.09, 0.3]} />
        </mesh>
        <mesh geometry={geo.button} material={m.brushed} position={[CASE.w / 2 - 0.02, -1.05, 0]} />
        <mesh material={m.engraving} position={[0, 0, -zTop - 0.004]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[3.5, 3.5]} />
        </mesh>
        <mesh geometry={geo.dome} material={m.dome} position={[0, 0, -zTop + 0.62]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]} />
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`w${i}`} geometry={geo.window} material={m.black} position={[Math.cos((i * Math.PI) / 2 + Math.PI / 4) * 0.5, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * 0.5, -zTop - 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.3, 1]} />
        ))}
        <group ref={bands}>
          <mesh geometry={geo.bandTop} material={m.band} castShadow />
          <mesh geometry={geo.bandBottom} material={m.band} castShadow />
          <mesh geometry={geo.keeper} material={m.band} castShadow />
          {geo.holes.map((h, i) => (
            <mesh key={`h${i}`} position={h.position} quaternion={h.quaternion} material={m.hole}>
              <cylinderGeometry args={[0.075, 0.068, 0.02, 28]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
