/**
 * The watch's inner layers as parts (innerParts.ts): the display stack, the logic board with its components and the
 * optical heart-rate module, the pouch cell, and the case's pocket. HaloWatch places each inside its lifting group.
 */
import { useLayoutEffect, useMemo, useRef, type JSX } from 'react'
import { BoxGeometry, CatmullRomCurve3, InstancedMesh, type Material, Object3D, Vector3 } from 'three'
import { BOARD, BOARD_PARTS, boardGeometry, CELL, type InternalMaterials, passives, POCKET, SCREWS } from './innerParts'
import { bandGeometry, CASE, DISPLAY, slabGeometry } from './parts'

const zTop = CASE.d / 2

/** One instanced set of small boxes (passives, connector pins): one draw call for many parts. */
function Boxes({ items, material, z }: { items: readonly { x: number; y: number; w: number; h: number; d: number; angle?: number }[]; material: Material; z: number }): JSX.Element {
  const mesh = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const o = new Object3D()
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, z + it.d / 2)
      o.rotation.set(0, 0, it.angle ?? 0)
      o.scale.set(it.w, it.h, it.d)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    return () => geometry.dispose()
  }, [items, z, geometry])
  return <instancedMesh ref={mesh} args={[geometry, material, items.length]} castShadow />
}

/** Layer 2: the OLED panel, its copper shield and the flex folding off the lower edge into its connector. */
export function DisplayParts({ m }: { m: InternalMaterials }): JSX.Element {
  const geo = useMemo(() => {
    const flexPath = [new Vector3(0, -1.35, zTop - 0.06), new Vector3(0, -1.8, zTop - 0.064), new Vector3(0, -1.9, zTop - 0.105), new Vector3(0, -1.83, zTop - 0.15), new Vector3(0, -1.4, zTop - 0.158), new Vector3(0, -1.05, zTop - 0.16)]
    return {
      panel: slabGeometry(DISPLAY.w - 0.12, DISPLAY.w - 0.12, DISPLAY.r - 0.06, 0.05, 0.01),
      shield: slabGeometry(DISPLAY.w - 0.42, DISPLAY.w - 0.5, DISPLAY.r - 0.25, 0.012, 0),
      flex: bandGeometry(flexPath, 0.9, 0.018, 48),
    }
  }, [])
  useLayoutEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  return (
    <>
      <mesh geometry={geo.panel} material={m.panel} position={[0, 0, zTop - 0.02]} />
      <mesh geometry={geo.shield} material={m.copper} position={[0, 0.05, zTop - 0.052]} />
      <mesh geometry={geo.flex} material={m.flex} />
      <mesh material={m.connector} position={[0, -1.0, zTop - 0.18]}>
        <boxGeometry args={[0.62, 0.2, 0.05]} />
      </mesh>
    </>
  )
}

/** Layer 3: the logic board and the optical heart-rate module. `led` is the green LEDs' material (it glows on step 3). */
export function BoardParts({ m, led }: { m: InternalMaterials; led: Material }): JSX.Element {
  const z = 0.12
  const top = z + BOARD.t / 2
  const geo = useMemo(() => ({ board: boardGeometry() }), [])
  useLayoutEffect(() => () => geo.board.dispose(), [geo])
  const small = useMemo(() => passives(), [])
  const caps = useMemo(() => small.filter((p) => p.kind === 'c').map((p) => ({ ...p, d: p.h * 0.9 })), [small])
  const res = useMemo(() => small.filter((p) => p.kind === 'r').map((p) => ({ ...p, d: p.h * 0.7 })), [small])
  const pins = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; d: number }[] = []
    const [tx, ty, tw] = BOARD_PARTS.b2bTop
    for (let i = 0; i < 16; i++) for (const row of [-1, 1]) out.push({ x: tx - tw / 2 + 0.07 + i * ((tw - 0.14) / 15), y: ty + row * 0.075, w: 0.025, h: 0.05, d: 0.03 })
    const [sx, sy, , sh] = BOARD_PARTS.b2bSide
    for (let i = 0; i < 12; i++) for (const row of [-1, 1]) out.push({ x: sx + row * 0.075, y: sy - sh / 2 + 0.07 + i * ((sh - 0.14) / 11), w: 0.05, h: 0.025, d: 0.03 })
    return out
  }, [])
  const chip = (key: 'soc' | 'memory' | 'pmic', material: Material, d: number): JSX.Element => {
    const [x, y, w, h] = BOARD_PARTS[key]
    return (
      <mesh position={[x, y, top + d / 2]} material={[m.resistor, m.resistor, m.resistor, m.resistor, material, m.resistor]} castShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
    )
  }
  const [ox, oy] = BOARD_PARTS.optical
  const [shx, shy, shw, shh] = BOARD_PARTS.shield
  const [btx, bty, btw, bth] = BOARD_PARTS.b2bTop
  const [bsx, bsy, bsw, bsh] = BOARD_PARTS.b2bSide
  return (
    <>
      <mesh geometry={geo.board} material={[m.pcb, m.connector]} position={[0, 0, z]} receiveShadow />
      {chip('soc', m.soc, 0.09)}
      {chip('memory', m.memory, 0.07)}
      {chip('pmic', m.pmic, 0.05)}
      <mesh position={[shx, shy, top + 0.065]} material={m.shield} castShadow>
        <boxGeometry args={[shw, shh, 0.13]} />
      </mesh>
      <mesh position={[btx, bty, top + 0.035]} material={m.connector}>
        <boxGeometry args={[btw, bth, 0.07]} />
      </mesh>
      <mesh position={[bsx, bsy, top + 0.035]} material={m.connector}>
        <boxGeometry args={[bsw, bsh, 0.07]} />
      </mesh>
      <Boxes items={pins} material={m.pin} z={top + 0.05} />
      <Boxes items={caps} material={m.capacitor} z={top} />
      <Boxes items={res} material={m.resistor} z={top} />
      {/* the optical heart-rate module: a domed lens over four green LEDs and four photodiodes */}
      <group position={[ox, oy, top]}>
        <mesh material={m.connector} position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 48]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2
          return (
            <group key={i}>
              <mesh material={led} position={[Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.05]}>
                <boxGeometry args={[0.07, 0.07, 0.02]} />
              </mesh>
              <mesh material={m.photodiode} position={[Math.cos(a + Math.PI / 4) * 0.2, Math.sin(a + Math.PI / 4) * 0.2, 0.05]}>
                <boxGeometry args={[0.09, 0.09, 0.015]} />
              </mesh>
            </group>
          )
        })}
        <mesh material={m.lens} position={[0, 0, 0.06]} scale={[1, 1, 0.25]}>
          <sphereGeometry args={[0.27, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
    </>
  )
}

/** Layer 4: the pouch cell with its seal flange, nickel tabs and the protection board. */
/** The cell's centre on the case axis. */
const CELL_Z = -0.12

export function CellParts({ m, protection }: { m: InternalMaterials; protection: Material }): JSX.Element {
  const z = CELL_Z
  const geo = useMemo(() => {
    const body = slabGeometry(CELL.w - 0.12, CELL.h - 0.12, 0.16, CELL.t - 0.12, 0.06)
    const seal = slabGeometry(CELL.w + 0.04, CELL.h - 0.2, 0.05, 0.02, 0)
    const tabPath = [new Vector3(0, CELL.h / 2 - 0.05, CELL_Z), new Vector3(0, CELL.h / 2 + 0.12, CELL_Z + 0.02), new Vector3(0, CELL.h / 2 + 0.2, CELL_Z + 0.1)]
    const tab = bandGeometry(new CatmullRomCurve3(tabPath).getPoints(12), 0.24, 0.012, 16)
    return { body, seal, tab }
  }, [])
  useLayoutEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  return (
    <>
      <mesh geometry={geo.body} material={[m.cell, m.seal]} position={[0, 0, z]} castShadow receiveShadow />
      <mesh geometry={geo.seal} material={m.seal} position={[0, 0, z]} />
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} geometry={geo.tab} material={m.nickel} position={[x, 0, 0]} />
      ))}
      <mesh material={protection} position={[0, CELL.h / 2 + 0.24, z + 0.12]}>
        <boxGeometry args={[1.7, 0.3, 0.05]} />
      </mesh>
      {[-0.45, 0, 0.42].map((x, i) => (
        <mesh key={x} material={m.resistor} position={[x, CELL.h / 2 + 0.24, z + 0.16]}>
          <boxGeometry args={[i === 1 ? 0.3 : 0.16, 0.16, 0.04]} />
        </mesh>
      ))}
    </>
  )
}

/** Inside the case: the turned floor, four screw bosses with Torx heads, and the dial's bracket. */
export function Pocket({ m, titanium, brushed }: { m: InternalMaterials; titanium: Material; brushed: Material }): JSX.Element {
  const inner = CASE.w - POCKET.wall * 2
  const geo = useMemo(() => {
    const housing = slabGeometry(0.74, 1.5, 0.12, 0.8, 0.03)
    housing.translate(0, 0, 0.4)
    return { floor: slabGeometry(inner, inner, CASE.r - POCKET.wall, POCKET.floor, 0.02), housing }
  }, [inner])
  useLayoutEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const floorTop = -zTop + POCKET.floor
  const bossH = 0.42
  return (
    <>
      <mesh geometry={geo.floor} material={[m.floor, titanium]} position={[0, 0, -zTop + POCKET.floor / 2]} receiveShadow />
      {SCREWS.map(([x, y]) => (
        <group key={`${x},${y}`} position={[x, y, floorTop]}>
          <mesh material={titanium} position={[0, 0, bossH / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.17, bossH, 32]} />
          </mesh>
          <mesh material={m.torx} position={[0, 0, bossH + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.025, 6]} />
          </mesh>
        </group>
      ))}
      {/* the dial's housing: a machined block against the inner wall that holds the wheel and its detent spring */}
      <mesh geometry={geo.housing} material={brushed} position={[inner / 2 - 0.36, 0.25, floorTop]} castShadow />
    </>
  )
}
