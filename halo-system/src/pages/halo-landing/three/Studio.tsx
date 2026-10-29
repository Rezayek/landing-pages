/**
 * The studio: how HALO is lit (FOUNDATIONS.md §10, "the studio light"). One large softbox from top left as the key
 * (a RectAreaLight), a cool rim from behind right, a studio of the same softboxes for the metal to reflect (baked through
 * PMREM), soft shadows and a contact shadow on the stage (taste-skill-ignore: WebGL light, not a CSS shadow). Neutral tone mapping, so the band's orange keeps its hue.
 * A transparent studio draws over the page's own stage (the story canvas), and a mood relights it for the night and
 * the pool without moving a light.
 */
import { ContactShadows } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import {
  BackSide,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PlaneGeometry,
  PMREMGenerator,
  type RectAreaLight,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
} from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

type V3 = [number, number, number]
export type Stage = 'black' | 'paper'

/** How the light changes for a worn moment: 0-1 each. Read every frame, so scroll never re-renders. */
export interface Mood {
  night: number
  pool: number
}

let uniformsReady = false

/**
 * The studio the metal and glass reflect: a dark room with the same softboxes as the lights (a large key above
 * left, a tall strip rim behind right, a thin overhead strip that draws the case's top edge, a low front card) and
 * a floor bounce. Built once and baked through PMREM, so it costs nothing per frame.
 */
function studioRoom(stage: Stage): Scene {
  const room = new Scene()
  const paper = stage === 'paper'
  const geometries: PlaneGeometry[] = []
  const add = (w: number, h: number, intensity: number, position: V3, tint = '#ffffff'): void => {
    const g = new PlaneGeometry(w, h)
    geometries.push(g)
    const mesh = new Mesh(g, new MeshBasicMaterial({ color: new Color(tint).multiplyScalar(intensity), side: DoubleSide }))
    mesh.position.set(...position)
    mesh.lookAt(0, 0, 0)
    room.add(mesh)
  }
  const walls = new Mesh(new SphereGeometry(30, 32, 16), new MeshBasicMaterial({ color: new Color(paper ? '#8c8c88' : '#141416'), side: BackSide }))
  room.add(walls)
  add(10, 7, 6, [-7, 8, 7], '#fff8ee') // the key softbox
  add(2.4, 12, 4.5, [9, 1.5, -7], '#eef2fa') // the rim strip
  add(5, 9, paper ? 1.2 : 0.8, [-13, 0, 2], '#f4f4f1') // side cards: a soft gradient down each satin flank
  add(5, 9, paper ? 1 : 0.6, [13, -1, 3], '#f4f4f1')
  add(14, 0.8, 3, [0, 11, 1]) // the overhead strip: a crisp line on every top edge
  add(12, 7, paper ? 1.6 : 1.1, [-11, 3, -7], '#f2f2ee') // a soft back fill, so the satin flanks and the case back keep their grey
  add(14, 6, paper ? 1.1 : 0.7, [1, 3, -13], '#eef0f4') // the back wall card, for the case back in the teardown
  add(8, 2.2, paper ? 0.8 : 0.22, [2, -1.5, 11]) // a low front card, so the bezel never goes black
  add(40, 40, paper ? 0.9 : 0.08, [0, -9, 0], paper ? '#f4f4f1' : '#ffffff') // the floor bounce
  room.userData.dispose = () => {
    geometries.forEach((g) => g.dispose())
    room.traverse((o) => {
      if (o instanceof Mesh) (o.material as MeshBasicMaterial).dispose()
    })
    walls.geometry.dispose()
  }
  return room
}

/**
 * Both stages' reflections are baked once, when the canvas starts, so a stage change (black to paper and back, on
 * scroll) only swaps a texture: no bake and no shader change mid-scroll.
 */
function Environment({ stage }: { stage: Stage }): null {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const envs = useRef<Record<Stage, Texture> | null>(null)
  useLayoutEffect(() => {
    if (!uniformsReady) {
      RectAreaLightUniformsLib.init()
      uniformsReady = true
    }
    const pmrem = new PMREMGenerator(gl)
    const bake = (s: Stage): Texture => {
      const room = studioRoom(s)
      const env = pmrem.fromScene(room, 0.02).texture
      room.userData.dispose()
      return env
    }
    envs.current = { black: bake('black'), paper: bake('paper') }
    // the warm-up compiles under both stages (Warmup)
    scene.userData.envs = envs.current
    pmrem.dispose()
    return () => {
      envs.current?.black.dispose()
      envs.current?.paper.dispose()
      envs.current = null
    }
  }, [gl, scene])
  useLayoutEffect(() => {
    if (!envs.current) return
    scene.environment = envs.current[stage]
    scene.environmentIntensity = 1
  }, [scene, stage])
  return null
}

const idle = (): Promise<void> => new Promise((resolve) => (window.requestIdleCallback ? window.requestIdleCallback(() => resolve(), { timeout: 120 }) : window.setTimeout(resolve, 16)))

/**
 * Gets the canvas ready before its first frame, so it never stalls the page when it starts (it renders nothing until
 * then; the page's poster holds the frame):
 *   1. every shader compiled, off the main thread where the browser can (KHR_parallel_shader_compile);
 *   2. every texture uploaded to the GPU, one per idle moment, instead of all of them inside the first frame.
 */
function Warmup({ onDone, onProgress }: { onDone: () => void; onProgress?: (share: number) => void }): null {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let live = true
    const run = async (): Promise<void> => {
      // the maps arrived (the watch rendered past its Suspense): the warm-up reports its own share of the start
      onProgress?.(0.45)
      // compile under each stage's reflections: an object first seen on the other stage would otherwise compile then
      const envs = scene.userData.envs as Record<Stage, Texture> | undefined
      const current = scene.environment
      for (const env of envs ? [envs.black, envs.paper] : [current]) {
        scene.environment = env
        await gl.compileAsync(scene, camera).catch(() => undefined)
      }
      scene.environment = current
      if (live) onProgress?.(0.7)
      const textures = new Set<Texture>()
      scene.traverse((o) => {
        const m = (o as Mesh).material
        for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
          for (const value of Object.values(mat)) if ((value as Texture | null)?.isTexture) textures.add(value as Texture)
        }
      })
      // three textures per idle moment: the page is behind its loading screen, so the start can go faster
      let n = 0
      for (const t of textures) {
        if (!live) return
        if (n % 3 === 0) await idle()
        gl.initTexture(t)
        n += 1
        onProgress?.(0.7 + (0.25 * n) / textures.size)
      }
      if (live) onDone()
    }
    void run()
    return () => {
      live = false
    }
  }, [gl, scene, camera, onDone, onProgress])
  return null
}

/** The camera aims in a small rig, so a parent re-render never resets its look (guides/three-d.md §Camera). */
export function Rig({ position, target }: { position: { current: V3 }; target: { current: V3 } }): null {
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    camera.position.set(...position.current)
    camera.lookAt(...target.current)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, position, target, invalidate])
  return null
}

const KEY_DAY = new Color('#fffaf2')
const KEY_NIGHT = new Color('#ff6a48')

export function Lights({ stage, mood }: { stage: Stage; mood?: { current: Mood } }): JSX.Element {
  const paper = stage === 'paper'
  const key = useRef<RectAreaLight>(null)
  const pool = useRef<RectAreaLight>(null)
  const gl = useThree((s) => s.gl)
  const base = paper ? 3.2 : 4.2
  const exposure = paper ? 1.0 : 1.12
  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [gl, exposure])
  useFrame(({ clock }) => {
    if (!mood) return
    const { night, pool: water } = mood.current
    if (key.current) {
      // the night: the key falls to a low red lamp
      key.current.intensity = base * (1 - 0.82 * night)
      key.current.color.copy(KEY_DAY).lerp(KEY_NIGHT, night)
    }
    if (pool.current) {
      // a cool caustic: a soft strip that drifts across the watch while the drops bead
      pool.current.intensity = 5 * water
      pool.current.position.x = -4 + Math.sin(clock.elapsedTime * 0.6) * 3
      pool.current.lookAt(0, 0, 0)
    }
    gl.toneMappingExposure = exposure * (1 - 0.3 * night)
  })
  return (
    <>
      {/* the key: a large softbox above and to the left, angled down at the watch */}
      <rectAreaLight ref={key} position={[-6, 7, 6]} width={9} height={6} intensity={base} color="#fffaf2" onUpdate={(l) => l.lookAt(0, 0, 0)} />
      {/* the rim: cool, from behind on the right, to draw the case edge and the band's curl */}
      <rectAreaLight position={[7, 2, -6]} width={3} height={8} intensity={paper ? 2 : 3.4} color="#e8f0ff" onUpdate={(l) => l.lookAt(0, 0, 0)} />
      {mood ? <rectAreaLight ref={pool} position={[-4, 6, 8]} width={2.5} height={7} intensity={0} color="#9fd4ff" /> : null}
      {/* a soft fill from below the camera, very low, so the underside never goes dead */}
      <directionalLight position={[2, -4, 8]} intensity={0.25} />
      {/* the one shadow-casting light, aligned with the key */}
      <directionalLight position={[-5, 8, 7]} intensity={0.6} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
    </>
  )
}

export interface StudioProps {
  stage: Stage
  camera: { position: V3; fov: number }
  children: ReactNode
  /** `never` while the canvas is off screen; `always` while something moves. */
  frameloop?: 'always' | 'demand' | 'never'
  shadow?: boolean
  className?: string
  /** Draw over the page's own stage colour instead of filling the canvas. */
  transparent?: boolean
  mood?: { current: Mood }
  /** Device pixel ratio range; phones take a lower ceiling. */
  dpr?: [number, number]
  onReady?: () => void
  /** The warm-up's progress, 0-1 (maps, shaders, textures), for the page's loading screen. */
  onProgress?: (share: number) => void
}

const STAGE_COLOUR = { black: '#000000', paper: '#f4f4f1' } as const

export function Studio({ stage, camera, children, frameloop = 'always', shadow = true, className, transparent, mood, dpr = [1, 2], onReady, onProgress }: StudioProps): JSX.Element { // taste-skill-ignore: a WebGL contact shadow, not a CSS shadow
  // nothing renders until the shaders are compiled (Warmup); the page's poster holds the frame until then
  const [compiled, setCompiled] = useState(false)
  const done = useRef(() => setCompiled(true)).current
  return (
    <Canvas
      className={className}
      // PCF, not "soft": this three.js renders PCFSoft as PCF but compiles ahead with PCFSoft, so the warmed shaders
      // would not match and every one would compile again on first use
      shadows="percentage"
      dpr={dpr}
      frameloop={compiled ? frameloop : 'never'}
      camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: !!transparent }}
      onCreated={({ gl, scene }) => {
        // a shader's error log is read synchronously, which forces its compile to finish there and then and undoes the
        // parallel warm-up; shader errors are caught in development, so the production build skips the check
        gl.debug.checkShaderErrors = import.meta.env.DEV
        // ?perf exposes the renderer to the performance scripts (programs compiled, frame timing)
        if (new URLSearchParams(window.location.search).has('perf')) ((window as unknown as { __haloGl?: unknown[] }).__haloGl ??= []).push(Object.assign(gl, { haloScene: scene }))
        gl.toneMapping = NeutralToneMapping
        gl.outputColorSpace = SRGBColorSpace
        if (transparent) gl.setClearColor(0x000000, 0)
        onReady?.()
      }}
    >
      {transparent ? null : <color attach="background" args={[new Color(STAGE_COLOUR[stage])]} />}
      <Environment stage={stage} />
      <Lights stage={stage} mood={mood} />
      <Suspense fallback={null}>
        {children}
        {/* stays mounted through stage changes: a prop change re-renders it once, with no new shaders */}
        {shadow ? ( // taste-skill-ignore: the WebGL contact shadow under the watch
          <ContactShadows position={[0, -6.2, 0]} scale={18} blur={2.8} far={9} opacity={stage === 'paper' ? 0.42 : 0} resolution={512} frames={1} color={stage === 'paper' ? '#2a2620' : '#000000'} />
        ) : null}
        <Warmup onDone={done} onProgress={onProgress} />
      </Suspense>
    </Canvas>
  )
}
