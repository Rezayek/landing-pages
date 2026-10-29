/**
 * HALO's parts as three.js geometry and materials, built in code (no model files). Real proportions: 1 unit = 10 mm.
 * The 45 mm case is 4.5 × 4.5 × 1.19 units, its corners at 26% of the side; the band is 24 mm wide.
 *
 *   case       a bead-blasted titanium body (an extrusion with a deep, smooth bevel), its display opening, a slot for
 *              the dial and short squared lugs
 *   bezel      the thin polished ring around the glass
 *   glass      flat sapphire: clear, a strong edge reflection
 *   display    the OLED panel that carries the face texture
 *   halo       the round ring printed under the glass (part of the face texture, plus a fine metal ring in 3D)
 *   dial       the knurled wheel in its slot, with the orange index
 *   sensors    the back: a sapphire dome, four optical windows, the electrodes
 *   board      the logic board between the display and the battery
 *   battery    a pouch cell with its label
 *   band       a silicone sport band, swept along a curve, with its pin holes
 */
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  Shape,
  Vector2,
  Vector3,
} from 'three'
import type { Maps } from './mapCache'

export const CASE = { w: 4.5, d: 1.19, r: 1.17, bevel: 0.16 } as const
export const DISPLAY = { w: 3.86, r: 0.86 } as const
export const BAND_W = 2.4

/** A rounded square (or rectangle) as a 2D shape, centred on the origin. */
export function roundedRect(w: number, h: number, r: number): Shape {
  const s = new Shape()
  const x = -w / 2, y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

/** The case body: an extrusion along z with a soft, deep bevel all round, so it reads as one machined block. */
export function caseGeometry(): ExtrudeGeometry {
  const inner = CASE.w - CASE.bevel * 2
  const shape = roundedRect(inner, inner, CASE.r - CASE.bevel)
  const g = new ExtrudeGeometry(shape, {
    depth: CASE.d - CASE.bevel * 2,
    bevelEnabled: true,
    bevelThickness: CASE.bevel,
    bevelSize: CASE.bevel,
    bevelSegments: 10,
    curveSegments: 40,
  })
  g.translate(0, 0, -(CASE.d - CASE.bevel * 2) / 2)
  g.computeVertexNormals()
  return g
}

/** A flat ring between two rounded squares (the bezel, the display gasket). */
export function ringGeometry(outerW: number, outerR: number, innerW: number, innerR: number, depth: number, bevel = 0.02): ExtrudeGeometry {
  const shape = roundedRect(outerW, outerW, outerR)
  shape.holes.push(roundedRect(innerW, innerW, innerR))
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 40 })
  g.computeVertexNormals()
  return g
}

/**
 * A lug horn: one tapered horn (two per edge, either side of the band), drawn as a side profile (outward × thickness) and extruded across
 * its width. Its root sinks into the case, its top slopes down from the case's top edge to a rounded tip
 * that just covers the band where it leaves. Built for the top edge; the bottom lug is the same turned half round.
 */
export function lugGeometry(width = 0.42): ExtrudeGeometry {
  const s = new Shape()
  s.moveTo(0, -0.5)
  s.lineTo(0.6, -0.31)
  s.quadraticCurveTo(0.74, -0.29, 0.74, -0.17)
  s.lineTo(0.74, 0.04)
  s.quadraticCurveTo(0.74, 0.15, 0.62, 0.17)
  s.bezierCurveTo(0.36, 0.22, 0.16, 0.36, 0, 0.4)
  s.lineTo(0, -0.5)
  const g = new ExtrudeGeometry(s, { depth: width - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 24 })
  // profile x -> outward (y), profile y -> thickness (z), extrusion -> across the band (x)
  g.applyMatrix4(new Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1))
  g.translate(-(width - 0.12) / 2, 0, 0)
  g.computeVertexNormals()
  return g
}

/** A flat rounded slab (the glass, the display panel, the board, the battery). */
export function slabGeometry(w: number, h: number, r: number, depth: number, bevel = 0.02): ExtrudeGeometry {
  const g = new ExtrudeGeometry(roundedRect(w, h, r), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 32,
  })
  g.translate(0, 0, -depth / 2)
  g.computeVertexNormals()
  return g
}

/** The dial wheel: a flat wheel whose rim carries 48 knurl ridges, its axis along z (it turns in the case's plane,
 * like a camera's control wheel, set into a slot so only its rim stands proud of the side). */
export function dialGeometry(radius = 0.56, length = 0.46): CylinderGeometry {
  const g = new CylinderGeometry(radius, radius, length, 192, 1, false)
  const pos = g.attributes.position
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const rr = Math.hypot(v.x, v.z)
    if (rr < radius * 0.98) continue // cap centre stays flat
    const a = Math.atan2(v.z, v.x)
    const ridge = 1 + 0.035 * Math.max(0, Math.cos(a * 48)) ** 2
    v.x *= ridge
    v.z *= ridge
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  g.rotateX(Math.PI / 2)
  return g
}

/**
 * The sport band: a rounded-rectangle cross-section swept along a curve (from the lug, up and back). The cross-section
 * is drawn in the curve's own frame so the band stays flat to the case and curls smoothly away from it.
 */
export function bandGeometry(points: Vector3[], width = BAND_W, thickness = 0.3, segments = 120): BufferGeometry {
  const curve = new CatmullRomCurve3(points, false, 'centripetal')
  const section: Vector2[] = []
  const r = thickness / 2
  const half = width / 2 - r
  // a stadium (rounded rectangle) cross-section, counter-clockwise
  for (let i = 0; i <= 12; i++) section.push(new Vector2(half + r * Math.cos(-Math.PI / 2 + (Math.PI * i) / 12), r * Math.sin(-Math.PI / 2 + (Math.PI * i) / 12)))
  for (let i = 0; i <= 12; i++) section.push(new Vector2(-half + r * Math.cos(Math.PI / 2 + (Math.PI * i) / 12), r * Math.sin(Math.PI / 2 + (Math.PI * i) / 12)))
  const ring = section.length
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const side = new Vector3(1, 0, 0) // the band's width runs along x, like the case's top edge
  const tangent = new Vector3()
  const normal = new Vector3()
  const p = new Vector3()
  for (let s = 0; s <= segments; s++) {
    const u = s / segments
    curve.getPointAt(u, p)
    curve.getTangentAt(u, tangent)
    normal.crossVectors(tangent, side).normalize()
    for (let k = 0; k < ring; k++) {
      const c = section[k]
      positions.push(p.x + side.x * c.x + normal.x * c.y, p.y + side.y * c.x + normal.y * c.y, p.z + side.z * c.x + normal.z * c.y)
      uvs.push(k / (ring - 1), u)
    }
  }
  // the section runs counter-clockwise seen down the curve, so each quad is wound (here, along, next) to face out
  for (let s = 0; s < segments; s++) {
    for (let k = 0; k < ring - 1; k++) {
      const a = s * ring + k, b = a + ring
      indices.push(a, a + 1, b, b, a + 1, b + 1)
    }
    const a = s * ring + ring - 1, b = a + ring
    indices.push(a, s * ring, b, b, s * ring, (s + 1) * ring)
  }
  // close the free end with a cap on its own vertices, so the cap's flat normal never bends the tube's shading
  const capStart = positions.length / 3
  const last = segments * ring
  for (let k = 0; k < ring; k++) {
    positions.push(positions[(last + k) * 3], positions[(last + k) * 3 + 1], positions[(last + k) * 3 + 2])
    uvs.push(0.5 + section[k].x / width, 0.5 + section[k].y / thickness)
  }
  const centre = positions.length / 3
  curve.getPointAt(1, p)
  positions.push(p.x, p.y, p.z)
  uvs.push(0.5, 0.5)
  for (let k = 0; k < ring; k++) indices.push(capStart + k, capStart + ((k + 1) % ring), centre)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

let engravingCache: CanvasTexture | null = null

/** The case back's engraving: a ring of laser-etched text around the sensor dome (an alpha map), drawn once a page. */
function engraving(): CanvasTexture {
  if (engravingCache) return engravingCache
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  for (const r of [300, 392]) {
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  const chars = [...'HALO  ·  GRADE 5 TITANIUM  ·  WATER RESISTANT 100 M  ·  A DESIGN STUDY  ·  ']
  ctx.font = "500 40px 'Host Grotesk Variable', Arial, sans-serif"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const step = (Math.PI * 2) / chars.length
  chars.forEach((ch, i) => {
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate(i * step)
    ctx.fillText(ch, 0, -346)
    ctx.restore()
  })
  const t = new CanvasTexture(canvas)
  t.colorSpace = NoColorSpace
  t.anisotropy = 8
  engravingCache = t
  return t
}

export interface Materials {
  titanium: MeshPhysicalMaterial
  brushed: MeshPhysicalMaterial
  recess: MeshStandardMaterial
  polished: MeshPhysicalMaterial
  glass: MeshPhysicalMaterial
  black: MeshStandardMaterial
  dome: MeshStandardMaterial
  board: MeshStandardMaterial
  gold: MeshStandardMaterial
  chip: MeshStandardMaterial
  band: MeshPhysicalMaterial
  hole: MeshStandardMaterial
  engraving: MeshStandardMaterial
  index: MeshStandardMaterial
  sensorGreen: MeshStandardMaterial
}

/** The watch's materials, on the page's shared surface maps (mapCache.ts): a second watch costs no texture work. */
export function createMaterials(maps: Maps): Materials {
  const blasted = { roughness: maps.blasted.rough, normal: maps.blasted.normal }
  const brushed = { roughness: maps.brushed.rough, normal: maps.brushed.normal }
  const silicone = { roughness: maps.silicone.rough, normal: maps.silicone.normal }
  return {
    // bead-blasted grade 5 titanium: a warm grey with a fine grain that sparkles in the key, brushed along its walls
    titanium: new MeshPhysicalMaterial({ color: new Color('#c4c6c9'), metalness: 1, roughness: 0.5, roughnessMap: blasted.roughness, normalMap: blasted.normal, normalScale: new Vector2(0.25, 0.25), anisotropy: 0.3, envMapIntensity: 1.4 }),
    // the case's top and back faces: brushed in straight lines, brighter than the blasted flanks
    brushed: new MeshPhysicalMaterial({ color: new Color('#c4c6c9'), metalness: 1, roughness: 0.3, roughnessMap: brushed.roughness, normalMap: brushed.normal, normalScale: new Vector2(0.18, 0.18), anisotropy: 0.85, envMapIntensity: 1.4 }),
    // the dial's recess: anodised dark titanium, so it reads as a cut into the case, not a hole
    recess: new MeshStandardMaterial({ color: new Color('#26272a'), metalness: 0.85, roughness: 0.5, normalMap: blasted.normal, normalScale: new Vector2(0.3, 0.3), envMapIntensity: 1 }),
    // the bezel and the dial: brushed, almost polished, the highlight stretched along the brushing
    polished: new MeshPhysicalMaterial({ color: new Color('#c3c6ca'), metalness: 1, roughness: 0.14, roughnessMap: brushed.roughness, normalMap: brushed.normal, normalScale: new Vector2(0.12, 0.12), anisotropy: 0.75, envMapIntensity: 1.35 }),
    // flat sapphire: adds only its reflections (the face shows through untouched), with a faint anti-reflective sheen
    glass: new MeshPhysicalMaterial({ color: new Color('#000000'), metalness: 0, roughness: 0.06, ior: 1.77, specularIntensity: 1, iridescence: 0.2, iridescenceIOR: 1.38, iridescenceThicknessRange: [180, 420], envMapIntensity: 0.55, transparent: true, blending: AdditiveBlending, depthWrite: false }),
    black: new MeshStandardMaterial({ color: new Color('#060607'), roughness: 0.35, metalness: 0.2 }),
    dome: new MeshStandardMaterial({ color: new Color('#0d0e10'), metalness: 0.1, roughness: 0.06, envMapIntensity: 1.6 }),
    board: new MeshStandardMaterial({ color: new Color('#23262a'), roughness: 0.55, metalness: 0.3, normalMap: blasted.normal, normalScale: new Vector2(0.4, 0.4) }),
    gold: new MeshStandardMaterial({ color: new Color('#c9a25b'), roughness: 0.3, metalness: 1 }),
    chip: new MeshStandardMaterial({ color: new Color('#101113'), roughness: 0.4, metalness: 0.4 }),
    // moulded silicone: matte with a fine grain, a soft sheen at grazing angles, no metal
    band: new MeshPhysicalMaterial({ color: new Color('#ff5a1f'), roughness: 0.62, roughnessMap: silicone.roughness, normalMap: silicone.normal, normalScale: new Vector2(0.16, 0.16), metalness: 0, sheen: 0.3, sheenRoughness: 0.6, sheenColor: new Color('#ffb08a'), envMapIntensity: 0.35, specularIntensity: 0.3 }),
    // a pin hole: the band's own colour in shadow, so it reads as a hole, not a stud
    hole: new MeshStandardMaterial({ color: new Color('#2a0e04'), roughness: 0.9, metalness: 0 }),
    // laser-etched lettering on the back: the same metal, darker and rougher
    engraving: new MeshStandardMaterial({ color: new Color('#8d9094'), metalness: 0.6, roughness: 0.85, alphaMap: engraving(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    index: new MeshStandardMaterial({ color: new Color('#ff5a1f'), roughness: 0.4, emissive: new Color('#ff5a1f'), emissiveIntensity: 0.15 }),
    sensorGreen: new MeshStandardMaterial({ color: new Color('#0c1a12'), emissive: new Color('#2cff8a'), emissiveIntensity: 0.0, roughness: 0.2 }),
  }
}
