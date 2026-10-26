import { Component, Suspense, lazy, useEffect, useRef, useState, type JSX, type ReactNode, type RefObject } from 'react'
import { RotateIcon } from '../feedback/icons'
import { InlineMessage, Spinner, usePending } from '../feedback'
import { IconButton } from '../ui'
import { describe as describeDesign } from './describe'
import { Poster } from './Poster'
import type { Design } from './data'

const Cake3D = lazy(() => import('./Cake3D'))

// Asked once per page and the probe context released at once: every stand asking for its own context ran the
// browser out of WebGL contexts on /system ("Too many active WebGL contexts").
let webglAnswer: boolean | undefined
function canUseWebGL(): boolean {
  if (typeof window === 'undefined') return false
  if (webglAnswer !== undefined) return webglAnswer
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  if (saveData) return (webglAnswer = false)
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return (webglAnswer = !!gl)
  } catch {
    return (webglAnswer = false)
  }
}

// The 3D chunk (about 240 KB gzip) is fetched only when the stand comes within a screen of the viewport, so a page
// whose builder sits further down keeps it out of its first view. Once near, it stays loaded.
function useNear(ref: RefObject<HTMLElement | null>): { ref: RefObject<HTMLElement | null>; value: boolean } {
  const [value, setValue] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || value) return
    if (typeof IntersectionObserver === 'undefined') return setValue(true)
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setValue(true), { rootMargin: '100% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, value])
  return { ref, value }
}

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }
  componentDidCatch(): void {
    this.props.onError()
  }
  render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}

export interface CakeStandProps {
  design: Design
  /** hero: a rendered study, still; builder: pinned (position: sticky) while the choices scroll past, live in 3D. */
  variant?: 'hero' | 'builder'
  /** The rendered study for the hero. */
  poster?: string
  /** Allow the live 3D cake (off on /system's still captures). */
  live?: boolean
  /** Simulate the 3D chunk failing (the /system state matrix). */
  failLive?: boolean
}

/**
 * The cake on its stand (COMPONENTS.md §Cake stand). The poster renders at first paint in the same composition; the
 * live cake loads after it (lazy) and replaces it without a shift. In the builder the stand is sticky (the scroll
 * story) and every change sets a tier down ('stack', MOTION-SYSTEM.md: signature moment). Turning is by the rotate
 * buttons (single click, keyboard); dragging is never required. Without WebGL, under Save-Data or on failure the
 * poster stays and says so. The description below is the cake for assistive technology.
 */
export function CakeStand({ design, variant = 'builder', poster, live = true, failLive }: CakeStandProps): JSX.Element {
  const [webgl] = useState(canUseWebGL)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [angle, setAngle] = useState(0)
  const near = useNear(useRef<HTMLElement>(null))
  const useLive = live && webgl && !failed && variant === 'builder' && near.value
  const showTurntable = usePending(useLive && !ready)
  useEffect(() => {
    if (failLive) setFailed(true)
  }, [failLive])
  const description = describeDesign(design)
  return (
    <figure ref={near.ref} className="ms-stand ms-stand-enter" data-variant={variant} aria-label={description} style={{ margin: 0 }}>
      {variant === 'hero' && poster ? (
        <img className="ms-stand__poster" src={poster} width={1200} height={1500} alt={description} fetchPriority="high" />
      ) : (
        <Poster design={design} hidden={useLive && ready} />
      )}
      {useLive ? (
        <Boundary onError={() => setFailed(true)}>
          {/* the live cake fades in over the poster once its first frame is ready (role swap) */}
          <div className="ms-stand__canvas" data-ready={ready || undefined}>
            <Suspense fallback={null}>
              <Cake3D design={design} angle={angle} onReady={() => setReady(true)} />
            </Suspense>
          </div>
        </Boundary>
      ) : null}
      {showTurntable ? (
        <span className="ms-stand__status">
          <Spinner size="sm" />
          Loading the 3D cake
        </span>
      ) : null}
      {failed && variant === 'builder' ? (
        <div className="ms-stand__msg">
          <InlineMessage tone="info" announceText="The 3D cake could not load. The drawing shows the same cake.">
            The 3D cake could not load. The drawing shows the same cake.
          </InlineMessage>
        </div>
      ) : null}
      {variant === 'builder' ? (
        <div className="ms-stand__controls">
          <IconButton label="Turn the cake left" icon={<RotateIcon direction="left" />} onClick={() => setAngle((a) => a - Math.PI / 4)} disabled={!useLive || !ready} disabledReason="The picture cannot turn" />
          <IconButton label="Turn the cake right" icon={<RotateIcon direction="right" />} onClick={() => setAngle((a) => a + Math.PI / 4)} disabled={!useLive || !ready} disabledReason="The picture cannot turn" />
        </div>
      ) : null}
      <figcaption className="ms-stand__credit">{variant === 'hero' ? 'Rendered study, not a photograph of our work' : 'Rendered study'}</figcaption>
    </figure>
  )
}
