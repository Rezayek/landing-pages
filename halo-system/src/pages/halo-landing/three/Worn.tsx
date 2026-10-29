/**
 * What the worn moments add to the studio (S3): a studio wrist form and the water drops that bead on the glass in the
 * pool. Both are built in code: no skin, no athlete (DESIGN.md §Sources, the coded stand-ins).
 */
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type JSX } from 'react'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, type Group, InstancedMesh, MeshPhysicalMaterial, Object3D, SphereGeometry } from 'three'
import { CASE, DISPLAY } from './parts'

/**
 * A studio wrist form: a forearm that tapers into the wrist, with the wrist bone on the little-finger side, then
 * widens and flattens into the start of the hand and closes in a rounded end. Built as one seamless grid (rings
 * along x, wrapped round the section), so the normals are smooth all round. Dark graphite with a velvet sheen, the
 * kind of form a counter uses to show a watch. `show` 0-1 lifts it into place from below.
 * At x = 0 the section is the one the band was shaped around (a 5.15 × 2.0 ellipse, centre 2.85 below the case).
 */
const ALONG = 220
const ROUND = 120
const X0 = -17 // the hand's end
const X1 = 26 // toward the elbow (out of frame)

const ease = (t: number): number => {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/** The section at x: semi-axes across (a, y) and through (b, z), and its centre on z. */
function section(x: number): { a: number; b: number; c: number } {
  const forearm = ease(x / 20) // 0 at the wrist, 1 toward the elbow
  const waist = Math.exp(-(((x + 1.6) / 2.4) ** 2)) // the narrowest point just below the watch
  const hand = ease((-x - 4) / 7) // 0 at the wrist, 1 across the palm
  let a = 5.15 + 0.85 * forearm - 0.2 * waist + 0.55 * hand
  let b = 2.0 + 0.6 * forearm - 0.12 * waist - 0.45 * hand
  const c = -2.85 - 0.45 * forearm + 0.25 * hand
  // the rounded end of the hand: the section closes over the last three units
  if (x < X0 + 3) {
    const k = Math.sqrt(Math.max(0, (x - X0) / 3))
    a *= k
    b *= k
  }
  return { a, b, c }
}

export function WristForm({ show }: { show: { current: number } }): JSX.Element {
  const group = useRef<Group>(null)
  const geometry = useMemo(() => {
    const pos: number[] = []
    const idx: number[] = []
    for (let i = 0; i <= ALONG; i++) {
      const x = X0 + ((X1 - X0) * i) / ALONG
      const { a, b, c } = section(x)
      // the wrist bone (ulna head): a soft rise on the little-finger side, just past the watch toward the hand
      const bone = 0.32 * Math.exp(-(((x + 2.6) / 1.2) ** 2))
      for (let k = 0; k < ROUND; k++) {
        const t = (k / ROUND) * Math.PI * 2
        const side = Math.exp(-(((t - Math.PI * 1.25) / 0.55) ** 2)) // toward −y, a little below the top
        const r = 1 + (bone * side) / Math.max(0.5, a * 0.2)
        pos.push(x, Math.cos(t) * a * r, c + Math.sin(t) * b * r)
      }
    }
    for (let i = 0; i < ALONG; i++) {
      for (let k = 0; k < ROUND; k++) {
        const p0 = i * ROUND + k, p1 = i * ROUND + ((k + 1) % ROUND)
        const q0 = p0 + ROUND, q1 = p1 + ROUND
        // wound (along the section, then along x) so each face points out of the form
        idx.push(p0, p1, q0, p1, q1, q0)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])
  const material = useMemo(() => {
    const m = new MeshPhysicalMaterial({ color: new Color('#26272b'), roughness: 0.86, metalness: 0, sheen: 1, sheenRoughness: 0.42, sheenColor: new Color('#6c6e76'), envMapIntensity: 0.7 })
    // a soft rim where the form turns away from the eye, on both contours, so the forearm reads round against the
    // black stage instead of as a slab with one lit edge
    // away from the watch the form falls into the black stage (it is lit only where the watch sits), so the arm has
    // no cut edge at the frame and reads as a form under one light
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vAlong;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlong = position.x;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAlong;')
        .replace(
          '#include <opaque_fragment>',
          'float rim = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);\noutgoingLight += vec3(0.25, 0.26, 0.29) * rim;\noutgoingLight *= 1.0 - smoothstep(4.5, 14.0, abs(vAlong));\n#include <opaque_fragment>',
        )
    }
    m.customProgramCacheKey = () => 'halo-wrist-rim'
    return m
  }, [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useFrame(() => {
    if (!group.current) return
    const s = show.current
    group.current.visible = s > 0.001
    group.current.position.z = -(1 - s) * 9
  })
  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} receiveShadow />
    </group>
  )
}

const DROPS = 34

/** Water on the sapphire: small clear domes that only add their reflections, growing in as the pool step plays. */
export function Drops({ amount }: { amount: { current: number } }): JSX.Element {
  const mesh = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => {
    const g = new SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)
    g.rotateX(Math.PI / 2)
    return g
  }, [])
  const material = useMemo(() => new MeshPhysicalMaterial({ color: new Color('#000000'), roughness: 0.04, ior: 1.33, specularIntensity: 1, envMapIntensity: 2.4, transparent: true, blending: AdditiveBlending, depthWrite: false }), [])
  // fixed seeds: the same drops every visit, spread over the glass and a few on the bezel
  const drops = useMemo(() => {
    let seed = 41
    const rnd = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const half = DISPLAY.w / 2 - 0.15
    return Array.from({ length: DROPS }, () => ({ x: (rnd() * 2 - 1) * half, y: (rnd() * 2 - 1) * half, r: 0.06 + rnd() ** 2 * 0.2, delay: rnd() * 0.6 }))
  }, [])
  const dummy = useMemo(() => new Object3D(), [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const a = amount.current
    m.visible = a > 0.001
    if (!m.visible) return
    const zTop = CASE.d / 2 + 0.12
    drops.forEach((d, i) => {
      const grow = Math.max(0, Math.min(1, (a - d.delay) / 0.35))
      const r = d.r * grow
      dummy.position.set(d.x, d.y, zTop)
      dummy.scale.set(r, r * 0.92, r * 0.42)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[geometry, material, DROPS]} renderOrder={3} frustumCulled={false} />
}
