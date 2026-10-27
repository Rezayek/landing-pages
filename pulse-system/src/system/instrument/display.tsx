/**
 * PULSE-1's displays (COMPONENTS.md): Led, Oled, Scope, EnvelopeDisplay, SpecList and the SoundSwitch that starts
 * the engine. The scope is raw WebGL2 fed by the real analyser; without WebGL, or before it loads, its SVG poster
 * and text readout stand in.
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore, type JSX, type ReactNode, type Ref } from 'react'
import { ActionButton, InlineMessage, announce } from '../feedback'
import { presetFor, wait, type LatencyId } from '../latency'
import { prefersReducedMotion, subscribeReducedMotion } from '../motion'
import { typeOn, pulsePlay } from '../vfx'
import { getAnalyser, start, stop, useEngine, type Patch } from './engine'

// -------------------------------------------------------------------------------------------------------------------
// LED
// -------------------------------------------------------------------------------------------------------------------
export type LedState = 'off' | 'on' | 'blink' | 'positive' | 'negative' | 'warning'

export function Led({ state, word, flashKey }: { state: LedState; word?: ReactNode; flashKey?: unknown }): JSX.Element {
  const dot = useRef<HTMLSpanElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (flashKey !== undefined) void pulsePlay(dot.current, 'led-flash')
  }, [flashKey])
  return (
    <span className="pi-led" data-state={state}>
      <span ref={dot} className="pi-led__dot" data-vfx={state === 'blink' ? 'led-blink' : undefined} aria-hidden="true" />
      {word ? <span className="pi-led__word">{word}</span> : null}
    </span>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// OLED readout
// -------------------------------------------------------------------------------------------------------------------
export function Oled({
  line1,
  line2,
  pending = false,
  error = false,
  size = 'md',
  hidden = false,
}: {
  line1: string
  line2?: string
  pending?: boolean
  error?: boolean
  size?: 'sm' | 'md'
  /** true when the readout repeats what a control already says to assistive technology */
  hidden?: boolean
}): JSX.Element {
  const l1 = useRef<HTMLSpanElement>(null)
  const frame = useRef<HTMLSpanElement>(null)
  const shown = useRef<string | null>(null)
  const text = line1.toUpperCase().slice(0, 16)
  useEffect(() => {
    if (shown.current === null) {
      shown.current = text
      if (l1.current) l1.current.textContent = text
      return
    }
    if (shown.current !== text) {
      shown.current = text
      void typeOn(l1.current, text)
    }
  }, [text])
  useEffect(() => {
    if (error) void pulsePlay(frame.current, 'clip')
  }, [error])
  return (
    <span
      ref={frame}
      className="pi-oled"
      data-size={size}
      data-error={error || undefined}
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : [line1, line2].filter(Boolean).join(', ')}
      role={hidden ? undefined : 'img'}
    >
      <span className="pi-oled__l1">
        <span ref={l1} />
        <span data-vfx="dots" data-pending={pending || undefined} aria-hidden="true" />
      </span>
      {line2 !== undefined ? <span className="pi-oled__l2">{line2.toUpperCase().slice(0, 16)}</span> : null}
    </span>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// Scope (WebGL2 + analyser)
// -------------------------------------------------------------------------------------------------------------------
const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`
const FRAG = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 o;
void main() { o = u_color; }`

function cssColor(el: Element, name: string): [number, number, number] {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  el.appendChild(probe)
  const m = getComputedStyle(probe).color.match(/[\d.]+/g) ?? ['0', '0', '0']
  probe.remove()
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255]
}

function useReduced(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true)
}

export interface ScopeProps {
  variant?: 'hero' | 'panel'
  /** a still level for /system demos when no audio runs: 'live' reads the analyser */
  demo?: 'live' | 'no-signal' | 'clip' | 'sine'
}

/** Level in dBFS from the analyser, and whether it clips. */
function level(data: Float32Array): { db: number; clip: boolean } {
  let sum = 0
  let peak = 0
  for (const v of data) {
    sum += v * v
    peak = Math.max(peak, Math.abs(v))
  }
  const rms = Math.sqrt(sum / data.length)
  return { db: rms > 0 ? 20 * Math.log10(rms) : -Infinity, clip: peak >= 0.99 }
}

export function Scope({ variant = 'panel', demo = 'live' }: ScopeProps): JSX.Element {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [webgl, setWebgl] = useState<'pending' | 'on' | 'missing'>('pending')
  const [paused, setPaused] = useState(false)
  const [reading, setReading] = useState<{ db: number; clip: boolean }>({ db: -Infinity, clip: demo === 'clip' })
  const reduced = useReduced()
  const { status, patch } = useEngine()

  // WebGL loads after first paint, only once the scope is near the viewport.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    let cancelled = false
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const go = (): void => {
          if (cancelled) return
          const gl = canvas.current?.getContext('webgl2', { preserveDrawingBuffer: true, antialias: true })
          setWebgl(gl ? 'on' : 'missing')
        }
        if ('requestIdleCallback' in window) window.requestIdleCallback(go, { timeout: 600 })
        else globalThis.setTimeout(go, 200)
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [])

  useEffect(() => {
    if (webgl !== 'on' || !canvas.current || !wrap.current) return
    const c = canvas.current
    const gl = c.getContext('webgl2', { preserveDrawingBuffer: true })
    if (!gl) return
    const compile = (type: number, src: string): WebGLShader => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    const loc = gl.getAttribLocation(prog, 'a_pos')
    const uColor = gl.getUniformLocation(prog, 'u_color')
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const bg = cssColor(wrap.current, '--scope-bg')
    const trace = cssColor(wrap.current, '--trace-1')
    const N = 512
    const samples = new Float32Array(2048)
    const verts = new Float32Array(N * 4)
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    let raf = 0
    let last = 0
    let lastReading = 0

    const resize = (): void => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.round(c.clientWidth * dpr)
      c.height = Math.round(c.clientHeight * dpr)
      gl.viewport(0, 0, c.width, c.height)
      gl.clearColor(bg[0], bg[1], bg[2], 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)

    const draw = (now: number): void => {
      raf = requestAnimationFrame(draw)
      const fps = reduced ? 4 : 60
      if (now - last < 1000 / fps - 2) return
      last = now
      const analyser = getAnalyser()
      if (analyser && status === 'on' && demo === 'live') analyser.getFloatTimeDomainData(samples)
      else if (demo === 'clip') for (let i = 0; i < samples.length; i++) samples[i] = Math.max(-1, Math.min(1, 1.6 * Math.sin(i / 40)))
      else if (demo === 'sine') {
        // a labelled demo signal for browsers that cannot run audio; its amplitude follows the LFO rate
        const lfo = 0.75 + 0.25 * Math.sin((now / 1000) * 2 * Math.PI * patch.lfoRate)
        for (let i = 0; i < samples.length; i++) samples[i] = lfo * 0.6 * (Math.sin(i / 26 + now / 90) + 0.3 * Math.sin(i / 9))
      }
      else samples.fill(0)
      // afterglow: fade the last frame towards the glass instead of clearing it (none under reduced motion)
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STREAM_DRAW)
      gl.uniform4f(uColor, bg[0], bg[1], bg[2], reduced ? 1 : 0.28)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      // the trace as a 2 px thick strip, offset along each point's normal so steep edges keep their width
      const half = Math.min(2, window.devicePixelRatio || 1)
      const step = Math.floor(samples.length / N)
      const px = (i: number): number => (i / (N - 1)) * c.width
      const py = (i: number): number => ((1 - samples[Math.min(N - 1, Math.max(0, i)) * step] * 0.85) / 2) * c.height
      for (let i = 0; i < N; i++) {
        const dx = px(i + 1) - px(i - 1)
        const dy = py(i + 1) - py(i - 1)
        const len = Math.hypot(dx, dy) || 1
        const nx = (-dy / len) * half
        const ny = (dx / len) * half
        const toX = (v: number): number => (v / c.width) * 2 - 1
        const toY = (v: number): number => 1 - (v / c.height) * 2
        verts.set([toX(px(i) - nx), toY(py(i) - ny), toX(px(i) + nx), toY(py(i) + ny)], i * 4)
      }
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW)
      gl.uniform4f(uColor, trace[0], trace[1], trace[2], 1)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, N * 2)
      if (now - lastReading > 250) {
        lastReading = now
        setReading(demo === 'clip' ? { db: 0, clip: true } : level(samples))
      }
    }
    if (!paused) raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [webgl, paused, reduced, status, demo, patch.lfoRate])

  const live = (status === 'on' && demo === 'live') || demo === 'sine'
  const signal = live && reading.db > -70
  // one short line in every state, so the bar never grows; the demo's reason sits on the glass
  const readout = demo === 'sine'
    ? `Demo signal · Level ${Number.isFinite(reading.db) ? `${Math.round(reading.db)} dB` : '—'}`
    : reading.clip
    ? 'Clipping. Turn the volume down.'
    : signal
      ? `Level ${Math.round(reading.db)} dB · No clipping`
      : live
        ? 'No signal. Play a key.'
        : demo === 'no-signal'
          ? 'No signal. Play a key.'
          : 'Sound is off'
  return (
    <figure className="pi-scope" data-variant={variant} ref={wrap}>
      <div className="pi-scope__glass" role="img" aria-label="Oscilloscope, showing the sound">
        <svg className="pi-scope__poster" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true" data-hidden={webgl === 'on' || undefined}>
          <path d="M0 100 C 25 40, 50 40, 75 100 S 125 160, 150 100 S 200 40, 225 100 S 275 160, 300 100 S 350 40, 375 100 L 400 100" />
        </svg>
        <canvas ref={canvas} className="pi-scope__canvas" data-on={webgl === 'on' || undefined} />
        <svg className="pi-scope__grid" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * 40} y1="0" x2={(i + 1) * 40} y2="200" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={(i + 1) * 25} x2="400" y2={(i + 1) * 25} />
          ))}
        </svg>
        {demo === 'sine' ? <span className="pi-scope__plate">Demo signal: audio can't run in this browser</span> : null}
      </div>
      <figcaption className="pi-scope__bar">
        <Led
          state={reading.clip ? 'negative' : live ? 'blink' : 'off'}
          word={reading.clip ? 'Clip' : live ? `LFO ${patch.lfoRate.toFixed(1)} Hz` : 'Off'}
        />
        <span className="pi-scope__readout" aria-live="off">
          {readout}
          {webgl === 'missing' ? ' The live scope needs WebGL. This readout still works.' : ''}
        </span>
        <button type="button" className="pi-quiet" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
          {paused ? 'Resume scope' : 'Pause scope'}
        </button>
      </figcaption>
    </figure>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// Envelope display (ADSR)
// -------------------------------------------------------------------------------------------------------------------
export function EnvelopeDisplay({ patch, editing }: { patch: Patch; editing?: 'a' | 'd' | 's' | 'r' }): JSX.Element {
  const { note } = useEngine()
  // widths scale with time, capped so a long release still fits
  const w = (s: number): number => 20 + Math.min(90, Math.sqrt(s) * 90)
  const a = w(patch.attack)
  const d = w(patch.decay)
  const s = 60
  const r = w(patch.release)
  const total = a + d + s + r
  const k = 380 / total
  const x0 = 10
  const x1 = x0 + a * k
  const x2 = x1 + d * k
  const x3 = x2 + s * k
  const x4 = x3 + r * k
  const top = 14
  const floor = 86
  const sy = floor - (floor - top) * patch.sustain
  const seg = (id: 'a' | 'd' | 's' | 'r', path: string): JSX.Element => (
    <path key={id} d={path} className="pi-env__seg" data-editing={editing === id || undefined} />
  )
  const label = `Envelope: attack ${Math.round(patch.attack * 1000)} ms, decay ${Math.round(patch.decay * 1000)} ms, sustain ${Math.round(
    patch.sustain * 100,
  )} %, release ${Math.round(patch.release * 1000)} ms`
  return (
    <svg className="pi-env" viewBox="0 0 400 100" role="img" aria-label={label} data-playing={note !== null || undefined}>
      {seg('a', `M${x0} ${floor} L${x1} ${top}`)}
      {seg('d', `M${x1} ${top} L${x2} ${sy}`)}
      {seg('s', `M${x2} ${sy} L${x3} ${sy}`)}
      {seg('r', `M${x3} ${sy} L${x4} ${floor}`)}
      {[
        [x1, top],
        [x2, sy],
        [x3, sy],
      ].map(([x, y]) => (
        <circle key={`${x}`} cx={x} cy={y} r="3" className="pi-env__dot" />
      ))}
      {(['A', 'D', 'S', 'R'] as const).map((l, i) => (
        <text key={l} x={[(x0 + x1) / 2, (x1 + x2) / 2, (x2 + x3) / 2, (x3 + x4) / 2][i]} y="98" className="pi-env__letter">
          {l}
        </text>
      ))}
    </svg>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// Spec list
// -------------------------------------------------------------------------------------------------------------------
export function SpecList({ items }: { items: readonly { term: string; value: string }[] }): JSX.Element {
  const id = useId()
  return (
    <section className="pi-specs" aria-labelledby={id}>
      <h3 id={id} className="pi-specs__caption">
        Specifications
      </h3>
      <dl className="pi-specs__list">
        {items.map((it) => (
          <div key={it.term} className="pi-specs__row">
            <dt className="pi-legend">{it.term}</dt>
            <dd>{it.value}</dd>
          </div>
        ))}
      </dl>
      <p className="pi-help">Invented for this study, like everything else here.</p>
    </section>
  )
}

// -------------------------------------------------------------------------------------------------------------------
// Sound switch: the page's one backlit key until the sound is on (or, `quiet`, a raised key with its LED, where the
// screen's one backlit key is another action)
// -------------------------------------------------------------------------------------------------------------------
export interface SoundSwitchProps {
  /** /system: make the start fail the way a blocking browser would */
  forceFailure?: 'blocked' | 'no-device' | null
  /** lets a /system story press the key */
  buttonRef?: Ref<HTMLButtonElement>
  /** a raised quiet key with its LED, never backlit: for a screen whose one backlit key is another action */
  quiet?: boolean
  /** a page's `?latency=`: the start waits that long first (labelled as simulated), and `fail` blocks it */
  latency?: LatencyId | null
}

export function SoundSwitch({ forceFailure = null, buttonRef, quiet = false, latency = null }: SoundSwitchProps): JSX.Element {
  const { status } = useEngine()
  const [error, setError] = useState<'blocked' | 'no-device' | null>(null)
  const [flash, setFlash] = useState(0)
  const msgId = useId()
  const on = status === 'on'

  async function toggle(): Promise<void> {
    if (on) {
      await stop()
      announce('Sound off')
      return
    }
    setError(null)
    if (latency) {
      const preset = presetFor(latency)
      await wait(preset.ms)
      if (preset.fails) {
        setError('blocked')
        throw new Error('blocked')
      }
    }
    if (forceFailure) {
      await new Promise((r) => window.setTimeout(r, 600))
      setError(forceFailure)
      throw new Error(forceFailure)
    }
    const result = await start()
    if (result !== 'on') {
      setError(result === 'no-device' ? 'no-device' : 'blocked')
      throw new Error(result)
    }
    setFlash((n) => n + 1)
  }

  return (
    <div className="pi-sound">
      <div className="pi-sound__row">
        <Led state={on ? 'on' : 'off'} word={on ? 'On' : 'Off'} flashKey={flash} />
        <ActionButton
          ref={buttonRef}
          variant={on || quiet ? 'secondary' : 'primary'}
          onAction={toggle}
          pendingLabel="Starting…"
          successLabel="Sound on"
          successMessage="Sound on"
          errorMessage={(e) =>
            e instanceof Error && e.message === 'no-device'
              ? 'No speakers or headphones found. Plug some in, then press Try again.'
              : "Your browser blocked the sound. Check the tab isn't muted, then press Try again."
          }
          aria-pressed={on}
          aria-describedby={error ? msgId : undefined}
        >
          {on ? 'Sound off' : error ? 'Try again' : 'Turn the sound on'}
        </ActionButton>
      </div>
      <div className="pi-sound__msg" id={msgId}>
        {error === 'blocked' ? (
          <InlineMessage tone="error" title="Your browser blocked the sound.">
            Check the tab isn't muted, then press Try again.
          </InlineMessage>
        ) : error === 'no-device' ? (
          <InlineMessage tone="error" title="No speakers or headphones found.">
            Plug some in, then press Try again.
          </InlineMessage>
        ) : !on ? (
          <p className="pi-help">
            Headphones on? Your neighbours will thank you.
            {latency ? ` Simulated start: ${presetFor(latency).label.toLowerCase()}.` : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}
