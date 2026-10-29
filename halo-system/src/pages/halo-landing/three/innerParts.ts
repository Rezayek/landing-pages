/**
 * HALO's insides, built like the real parts of a watch so the teardown reads as engineering (MOTION.md, S2). Every
 * texture is drawn on a canvas at mount (no downloads), and every size follows the case (1 unit = 10 mm):
 *
 *   display    the OLED stack: a black glass panel, a copper shield sheet on its back, an amber polyimide flex that
 *              folds off the lower edge into a board-to-board connector
 *   board      the logic board: a dark solder-mask PCB with traces, vias, gold pads and silkscreen; the system chip,
 *              memory, power IC, a stamped RF shield can, two board-to-board connectors, about ninety 0201 and 0402
 *              passives, and the optical heart-rate module with its green LEDs and photodiodes
 *   battery    a lithium-polymer pouch: aluminium laminate with soft wrinkles, its folded seal flange, a printed
 *              label, two nickel tabs and the protection board with its flex
 *   pocket     the inside of the case: a turned titanium floor, four screw bosses with Torx heads, the dial's bracket
 */
import {
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  Vector2,
} from 'three'
import type { Maps } from './mapCache'
import { CASE, roundedRect } from './parts'

const FONT = "'Host Grotesk Variable', 'Host Grotesk', Arial, sans-serif"

function canvas(size: number, h = size): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = size
  c.height = h
  return [c, c.getContext('2d') as CanvasRenderingContext2D]
}

function texture(c: HTMLCanvasElement, colour: boolean): CanvasTexture {
  const t = new CanvasTexture(c)
  t.colorSpace = colour ? SRGBColorSpace : NoColorSpace
  t.anisotropy = 8
  return t
}

/** A seeded random source, so every visit builds the same board. */
function seeded(seed: number): () => number {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

// ---------------------------------------------------------------------------------------------------------------
// The logic board
// ---------------------------------------------------------------------------------------------------------------

export const BOARD = { w: 3.5, h: 3.3, r: 0.62, t: 0.06 } as const

/** Where the board's larger parts sit (x, y, w, h in units), shared by the PCB drawing and the 3D parts. */
export const BOARD_PARTS = {
  soc: [-0.55, 0.45, 1.05, 1.05],
  memory: [0.75, 0.75, 0.62, 0.78],
  pmic: [0.85, -0.25, 0.5, 0.5],
  shield: [-0.5, -0.95, 1.5, 0.78],
  b2bTop: [0.2, 1.35, 1.0, 0.22],
  b2bSide: [1.35, -1.05, 0.24, 0.8],
  optical: [-1.15, -0.05, 0.6, 0.6],
} as const

const PX = 1024
const toPx = (x: number, y: number): [number, number] => [((x + BOARD.w / 2) / BOARD.w) * PX, ((BOARD.h / 2 - y) / BOARD.h) * PX]

/** The board outline: a rounded rectangle with a notch for the dial's bracket and four screw holes. */
export function boardGeometry(): ExtrudeGeometry {
  const s = roundedRect(BOARD.w, BOARD.h, BOARD.r)
  const notch = new Shape()
  // the notch is cut as a hole that reaches the edge: a slim slot for the dial's bracket
  notch.moveTo(BOARD.w / 2 - 0.38, 0.05)
  notch.lineTo(BOARD.w / 2 - 0.12, 0.05)
  notch.lineTo(BOARD.w / 2 - 0.12, 0.62)
  notch.lineTo(BOARD.w / 2 - 0.38, 0.62)
  notch.lineTo(BOARD.w / 2 - 0.38, 0.05)
  s.holes.push(notch)
  for (const [x, y] of SCREWS) {
    const hole = new Shape()
    hole.absarc(x, y, 0.07, 0, Math.PI * 2, false)
    s.holes.push(hole)
  }
  const g = new ExtrudeGeometry(s, { depth: BOARD.t, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 24 })
  g.translate(0, 0, -BOARD.t / 2)
  g.computeVertexNormals()
  return g
}

/** The four screws that hold the board to the case: their holes in the board and their bosses in the pocket. */
export const SCREWS: readonly (readonly [number, number])[] = [
  [-1.35, 1.25],
  [1.35, 1.25],
  [-1.35, -1.25],
  [1.2, -1.45],
]

/** The PCB's face: solder mask, copper traces under it, gold pads and vias, white silkscreen. Plus a metalness map. */
function pcbMaps(): { map: CanvasTexture; metal: CanvasTexture; rough: CanvasTexture } {
  const rnd = seeded(97)
  const [c, g] = canvas(PX)
  const [mc, mg] = canvas(PX)
  const [rc, rg] = canvas(PX)
  g.fillStyle = '#0c1d17'
  g.fillRect(0, 0, PX, PX)
  mg.fillStyle = '#000'
  mg.fillRect(0, 0, PX, PX)
  rg.fillStyle = '#7a7a7a'
  rg.fillRect(0, 0, PX, PX)
  // copper traces under the mask: orthogonal runs with 45° turns, a touch lighter than the mask
  g.lineCap = 'round'
  g.lineJoin = 'round'
  for (let i = 0; i < 260; i++) {
    let x = rnd() * PX, y = rnd() * PX
    g.strokeStyle = rnd() < 0.15 ? '#21453a' : '#173328'
    g.lineWidth = rnd() < 0.2 ? 5 : 2
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 0; k < 4; k++) {
      const len = 20 + rnd() * 120
      const dir = Math.floor(rnd() * 8) * (Math.PI / 4)
      x += Math.cos(dir) * len
      y += Math.sin(dir) * len
      g.lineTo(x, y)
    }
    g.stroke()
  }
  // a ground pour hatch in one corner
  g.strokeStyle = '#132a22'
  g.lineWidth = 1
  for (let i = -PX; i < PX; i += 9) {
    g.beginPath()
    g.moveTo(i, PX * 0.72)
    g.lineTo(i + PX * 0.28, PX)
    g.stroke()
  }
  const gold = (x: number, y: number, w: number, h: number, round = false): void => {
    for (const [ctx, fill] of [[g, '#c7a15a'], [mg, '#fff']] as const) {
      ctx.fillStyle = fill
      if (round) {
        ctx.beginPath()
        ctx.arc(x, y, w, 0, Math.PI * 2)
        ctx.fill()
      } else ctx.fillRect(x - w / 2, y - h / 2, w, h)
    }
    rg.fillStyle = '#3a3a3a'
    rg.fillRect(x - w / 2, y - h / 2, w, h)
  }
  // vias: small gold rings
  for (let i = 0; i < 320; i++) {
    const x = rnd() * PX, y = rnd() * PX
    gold(x, y, 3.2, 0, true)
    g.fillStyle = '#05100c'
    g.beginPath()
    g.arc(x, y, 1.4, 0, Math.PI * 2)
    g.fill()
  }
  // test pads and edge contacts
  for (let i = 0; i < 14; i++) gold(PX * 0.08 + i * 26, PX * 0.97, 14, 22)
  for (let i = 0; i < 9; i++) gold(PX * 0.06, PX * 0.3 + i * 24, 16, 16)
  // pads under the big parts' edges, and silkscreen outlines with reference designators
  g.font = `600 15px ${FONT}`
  g.strokeStyle = '#d9d8cf'
  g.fillStyle = '#d9d8cf'
  g.lineWidth = 2
  const labels: Record<string, string> = { soc: 'U1', memory: 'U2', pmic: 'U5', shield: 'SH1', b2bTop: 'J1', b2bSide: 'J2', optical: 'U9' }
  for (const [key, [x, y, w, h]] of Object.entries(BOARD_PARTS)) {
    const [px, py] = toPx(x - w / 2 - 0.04, y + h / 2 + 0.04)
    const pw = ((w + 0.08) / BOARD.w) * PX, ph = ((h + 0.08) / BOARD.h) * PX
    g.strokeRect(px, py, pw, ph)
    g.fillText(labels[key], px + 4, py - 6)
  }
  // passives' designators scattered, and the board's name
  for (let i = 0; i < 40; i++) g.fillText(`${rnd() < 0.5 ? 'C' : 'R'}${Math.floor(rnd() * 90) + 10}`, rnd() * PX * 0.9, rnd() * PX * 0.9 + 20)
  g.font = `600 22px ${FONT}`
  g.fillText('HALO MLB  REV C  2026', PX * 0.36, PX * 0.93)
  g.font = `500 14px ${FONT}`
  g.fillText('DESIGN STUDY · NOT A PRODUCT', PX * 0.4, PX * 0.955)
  const all = [texture(c, true), texture(mc, false), texture(rc, false)]
  all.forEach((t) => {
    // ExtrudeGeometry's cap UVs are the shape's own units: map the board's width onto the texture
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / BOARD.w, 1 / BOARD.h)
    t.offset.set(0.5, 0.5)
  })
  return { map: all[0], metal: all[1], rough: all[2] }
}

/** A chip's top: dark moulding with its laser marking and the pin-1 dot. */
function chipTop(lines: readonly string[]): CanvasTexture {
  const [c, g] = canvas(256)
  g.fillStyle = '#16171a'
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = '#4a4c52'
  g.font = `500 30px ${FONT}`
  lines.forEach((l, i) => g.fillText(l, 26, 96 + i * 40))
  g.beginPath()
  g.arc(30, 30, 9, 0, Math.PI * 2)
  g.fill()
  return texture(c, true)
}

/** The RF shield can: stamped tin with a grid of small vent holes. */
function shieldMap(): CanvasTexture {
  const [c, g] = canvas(512, 256)
  g.fillStyle = '#c9ccd0'
  g.fillRect(0, 0, 512, 256)
  g.fillStyle = '#505357'
  for (let y = 22; y < 256; y += 26) for (let x = 22; x < 512; x += 26) {
    g.beginPath()
    g.arc(x + (Math.floor(y / 26) % 2) * 13, y, 4, 0, Math.PI * 2)
    g.fill()
  }
  return texture(c, true)
}

// ---------------------------------------------------------------------------------------------------------------
// The battery
// ---------------------------------------------------------------------------------------------------------------

export const CELL = { w: 2.9, h: 2.4, t: 0.3 } as const

/** The pouch's top: aluminium laminate, the black label with the cell's data, and a metalness map for both. */
function cellMaps(): { map: CanvasTexture; metal: CanvasTexture } {
  const W = 1024, H = Math.round((W * CELL.h) / CELL.w)
  const [c, g] = canvas(W, H)
  const [mc, mg] = canvas(W, H)
  const grad = g.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#c3c6ca')
  grad.addColorStop(1, '#aeb1b6')
  g.fillStyle = grad
  g.fillRect(0, 0, W, H)
  mg.fillStyle = '#fff'
  mg.fillRect(0, 0, W, H)
  // the label: most of the face, a black film with white print
  const lx = W * 0.08, ly = H * 0.12, lw = W * 0.84, lh = H * 0.62
  for (const [ctx, fill] of [[g, '#111214'], [mg, '#000']] as const) {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(lx, ly, lw, lh, 18)
    ctx.fill()
  }
  g.fillStyle = '#e9e9e4'
  g.font = `600 46px ${FONT}`
  g.fillText('HALO', lx + 40, ly + 80)
  g.font = `400 30px ${FONT}`
  g.fillText('Li-ion polymer cell · A2647', lx + 40, ly + 130)
  g.fillText('3.87 V  ·  612 mAh  ·  2.37 Wh', lx + 40, ly + 176)
  g.fillStyle = '#9a9b9f'
  g.font = `400 24px ${FONT}`
  g.fillText('Illustrative: a design study, not a product', lx + 40, ly + 226)
  g.strokeStyle = '#e9e9e4'
  g.lineWidth = 3
  for (let i = 0; i < 4; i++) g.strokeRect(lx + lw - 70 - i * 64, ly + lh - 76, 46, 46)
  const maps = { map: texture(c, true), metal: texture(mc, false) }
  // the pouch's cap UVs are its own units: fit the drawing to the cell
  for (const t of [maps.map, maps.metal]) {
    t.repeat.set(1 / CELL.w, 1 / CELL.h)
    t.offset.set(0.5, 0.5)
  }
  return maps
}

// ---------------------------------------------------------------------------------------------------------------
// The flex circuits and the case floor
// ---------------------------------------------------------------------------------------------------------------

/** Polyimide flex: amber film with copper traces running its length. */
function flexMap(): CanvasTexture {
  const [c, g] = canvas(256, 512)
  g.fillStyle = '#b8651c'
  g.fillRect(0, 0, 256, 512)
  g.strokeStyle = '#d99a55'
  g.lineWidth = 3
  for (let x = 18; x < 256; x += 14) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, 512)
    g.stroke()
  }
  const t = texture(c, true)
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

/** The case is a shell: this wall all round, and a floor this thick at the back. */
export const POCKET = { wall: 0.3, floor: 0.26 } as const

/**
 * The case body as a hollow shell: an extruded ring. The bevel rounds both contours, eating into the wall from each
 * side, so the two contours must keep a web between them or the opening is lost (the cap then closes over it).
 * A slightly smaller bevel than the solid case's keeps a 0.8 mm web inside a 3 mm wall.
 */
const SHELL_BEVEL = 0.11

export function shellGeometry(): ExtrudeGeometry {
  const bevel = SHELL_BEVEL
  const outer = roundedRect(CASE.w - bevel * 2, CASE.w - bevel * 2, CASE.r - bevel)
  const innerW = CASE.w - POCKET.wall * 2
  if (innerW + bevel * 2 >= CASE.w - bevel * 2) throw new Error('shellGeometry: the wall is thinner than two bevels')
  outer.holes.push(roundedRect(innerW + bevel * 2, innerW + bevel * 2, CASE.r - POCKET.wall + bevel))
  const g = new ExtrudeGeometry(outer, { depth: CASE.d - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 10, curveSegments: 40 })
  g.translate(0, 0, -(CASE.d - bevel * 2) / 2)
  g.computeVertexNormals()
  return g
}

// ---------------------------------------------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------------------------------------------

export interface InternalMaterials {
  panel: MeshPhysicalMaterial
  copper: MeshStandardMaterial
  flex: MeshStandardMaterial
  connector: MeshStandardMaterial
  pcb: MeshStandardMaterial
  soc: MeshStandardMaterial
  memory: MeshStandardMaterial
  pmic: MeshStandardMaterial
  shield: MeshStandardMaterial
  capacitor: MeshStandardMaterial
  resistor: MeshStandardMaterial
  pin: MeshStandardMaterial
  lens: MeshStandardMaterial
  photodiode: MeshStandardMaterial
  cell: MeshStandardMaterial
  seal: MeshStandardMaterial
  nickel: MeshStandardMaterial
  floor: MeshPhysicalMaterial
  torx: MeshStandardMaterial
}

/** The canvas-drawn textures (board, cell, flex, chips, shield): drawn once a page, shared by every watch. */
let drawn: ReturnType<typeof drawAll> | null = null
function drawAll() {
  const flex = flexMap()
  flex.repeat.set(1, 1)
  return { pcb: pcbMaps(), cell: cellMaps(), flex, soc: chipTop(['H1', '2647 A3', 'TW 26']), memory: chipTop(['LP5 16G', '2641']), pmic: chipTop(['P27', '2638']), shield: shieldMap() }
}

/**
 * The inner parts' materials, on the page's shared maps. Only the parts that need a clear coat or anisotropy use the
 * physical shader; the rest are standard, so the first frame compiles fewer programs.
 */
export function createInternalMaterials(maps: Maps): InternalMaterials {
  const d = (drawn ??= drawAll())
  return {
    // the OLED panel: black glass with a sharp clear coat
    panel: new MeshPhysicalMaterial({ color: new Color('#050507'), roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2 }),
    copper: new MeshStandardMaterial({ color: new Color('#b8743f'), metalness: 1, roughness: 0.38, envMapIntensity: 1.2 }),
    flex: new MeshStandardMaterial({ map: d.flex, roughness: 0.28, metalness: 0, envMapIntensity: 0.9 }),
    connector: new MeshStandardMaterial({ color: new Color('#1b1c1f'), roughness: 0.55, metalness: 0.2 }),
    pcb: new MeshStandardMaterial({ map: d.pcb.map, metalnessMap: d.pcb.metal, roughnessMap: d.pcb.rough, metalness: 1, roughness: 0.62, envMapIntensity: 1 }),
    soc: new MeshStandardMaterial({ map: d.soc, roughness: 0.4, metalness: 0.1, envMapIntensity: 0.9 }),
    memory: new MeshStandardMaterial({ map: d.memory, roughness: 0.4, metalness: 0.1, envMapIntensity: 0.9 }),
    pmic: new MeshStandardMaterial({ map: d.pmic, roughness: 0.4, metalness: 0.1, envMapIntensity: 0.9 }),
    shield: new MeshStandardMaterial({ map: d.shield, metalness: 1, roughness: 0.34, envMapIntensity: 1.3 }),
    capacitor: new MeshStandardMaterial({ color: new Color('#8a6a4c'), roughness: 0.6, metalness: 0 }),
    resistor: new MeshStandardMaterial({ color: new Color('#111113'), roughness: 0.5, metalness: 0 }),
    pin: new MeshStandardMaterial({ color: new Color('#d4ad62'), roughness: 0.25, metalness: 1 }),
    lens: new MeshStandardMaterial({ color: new Color('#0a0c0e'), roughness: 0.04, metalness: 0, envMapIntensity: 1.8 }),
    photodiode: new MeshStandardMaterial({ color: new Color('#2a1d3a'), roughness: 0.3, metalness: 0.2 }),
    cell: new MeshStandardMaterial({ map: d.cell.map, metalnessMap: d.cell.metal, metalness: 0.85, roughness: 0.3, normalMap: maps.wrinkle, normalScale: new Vector2(0.18, 0.18), envMapIntensity: 1.2 }),
    seal: new MeshStandardMaterial({ color: new Color('#a7aaaf'), metalness: 0.8, roughness: 0.4 }),
    nickel: new MeshStandardMaterial({ color: new Color('#c8c9c6'), metalness: 1, roughness: 0.3 }),
    floor: new MeshPhysicalMaterial({ color: new Color('#a9acb0'), metalness: 1, roughness: 0.3, normalMap: maps.turned, normalScale: new Vector2(0.25, 0.25), anisotropy: 0.6, envMapIntensity: 1.3 }),
    torx: new MeshStandardMaterial({ color: new Color('#2a2b2e'), metalness: 1, roughness: 0.45 }),
  }
}

/** Seeded positions for the board's small passives, kept clear of the big parts and the screws. */
export function passives(): { x: number; y: number; w: number; h: number; kind: 'c' | 'r'; angle: number }[] {
  const rnd = seeded(31)
  const parts = Object.values(BOARD_PARTS)
  const out: { x: number; y: number; w: number; h: number; kind: 'c' | 'r'; angle: number }[] = []
  let guard = 0
  while (out.length < 92 && guard++ < 4000) {
    const x = (rnd() - 0.5) * (BOARD.w - 0.5), y = (rnd() - 0.5) * (BOARD.h - 0.5)
    const big = rnd() < 0.3
    const w = big ? 0.1 : 0.06, h = big ? 0.05 : 0.03
    const clear = parts.every(([px, py, pw, ph]) => Math.abs(x - px) > pw / 2 + 0.08 || Math.abs(y - py) > ph / 2 + 0.08)
    const freeOfScrews = SCREWS.every(([sx, sy]) => Math.hypot(x - sx, y - sy) > 0.22)
    const inside = Math.abs(x) < BOARD.w / 2 - 0.25 && Math.abs(y) < BOARD.h / 2 - 0.25
    if (clear && freeOfScrews && inside) out.push({ x, y, w, h, kind: rnd() < 0.62 ? 'c' : 'r', angle: rnd() < 0.5 ? 0 : Math.PI / 2 })
  }
  return out
}
