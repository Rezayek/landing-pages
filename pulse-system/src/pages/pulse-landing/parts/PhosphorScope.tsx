/**
 * Hero sprint (comp 1c): a phosphor CRT in raw WebGL2. Pass 1 keeps a persistence buffer: the last frame fades and
 * the trace is added on top (additive), so it leaves afterglow trails. Pass 2 draws the tube: barrel curve, bloom,
 * a chromatic fringe, a procedural graticule, a faint FFT spectrum ghost, scanlines and a vignette.
 *
 * Motion (MOTION.md): on load the tube powers on like hardware: a dot, a line that blooms open, a warm-up flicker
 * (~1.5 s, once). `offRef` (0..1, from the hero's scroll) switches it off again: the picture collapses to a line, then
 * a dot, with the colours splitting. It answers the sound: a note flashes the phosphor, a knob turn ripples it, a wave
 * change or a patch load re-sweeps it from the line, and a faint scanline rolls. Reduced motion: no boot, no off, no
 * ripple or roll; the flash stays (it is state).
 *
 * Signal: the real analyser when the sound is on. With the sound off it previews the patch silently: the waveform at
 * the held note (or A2) through an RBJ low-pass with the patch's cutoff and resonance, its cutoff wobbled by the LFO,
 * and the spectrum from the same filter's response. Without WebGL the static poster stays.
 */
import { useEffect, useRef, useState, type JSX } from 'react'
import { engine } from '@/system/instrument'
import type { Patch } from '@/system/instrument'

const N = 512 // trace points
const BINS = 48 // spectrum ghost bars
const FS = 44100
const midiHz = (m: number): number => 440 * 2 ** ((m - 69) / 12)

/** level listeners: the output VU reads the scope's measured level */
let level = 0
const levelListeners = new Set<(v: number) => void>()
export function onLevel(fn: (v: number) => void): () => void {
  levelListeners.add(fn)
  return () => levelListeners.delete(fn)
}

function osc(wave: Patch['wave'], phase: number): number {
  const p = phase - Math.floor(phase)
  if (wave === 'sine') return Math.sin(p * 2 * Math.PI)
  if (wave === 'square') return p < 0.5 ? 0.8 : -0.8
  if (wave === 'triangle') return 4 * Math.abs(p - 0.5) - 1
  return 2 * p - 1
}

/** RBJ low-pass coefficients */
function lowpass(fc: number, q: number): [number, number, number, number, number] {
  const w = (2 * Math.PI * Math.min(fc, FS * 0.45)) / FS
  const alpha = Math.sin(w) / (2 * Math.max(0.3, q))
  const cos = Math.cos(w)
  const a0 = 1 + alpha
  return [(1 - cos) / 2 / a0, (1 - cos) / a0, (1 - cos) / 2 / a0, (-2 * cos) / a0, (1 - alpha) / a0]
}

/** |H(f)| of the low-pass at f */
function response(f: number, c: [number, number, number, number, number]): number {
  const w = (2 * Math.PI * f) / FS
  const [b0, b1, b2, a1, a2] = c
  const re = (k0: number, k1: number, k2: number): [number, number] => [k0 + k1 * Math.cos(w) + k2 * Math.cos(2 * w), -(k1 * Math.sin(w) + k2 * Math.sin(2 * w))]
  const [nr, ni] = re(b0, b1, b2)
  const [dr, di] = re(1, a1, a2)
  return Math.hypot(nr, ni) / Math.max(1e-6, Math.hypot(dr, di))
}

/** the silent preview: one window of the filtered waveform, and its spectrum */
function preview(patch: Patch, note: number | null, t: number, out: Float32Array, spectrum: Float32Array): void {
  const f0 = midiHz(note ?? 45)
  const lfo = 1 + patch.lfoDepth * Math.sin(t * 2 * Math.PI * patch.lfoRate)
  const c = lowpass(Math.max(40, patch.cutoff * lfo), patch.resonance)
  const amp = note === null ? 0.55 : 0.85
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  const total = 3072
  const start = total - out.length * 3 // three samples per point: about 3.8 cycles of A2
  for (let i = 0; i < total; i++) {
    const x = osc(patch.wave, (f0 * i) / FS + t * 0.02)
    const y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2
    x2 = x1; x1 = x; y2 = y1; y1 = y
    if (i >= start && (i - start) % 3 === 0) out[(i - start) / 3] = Math.max(-1.2, Math.min(1.2, y * amp))
  }
  for (let b = 0; b < spectrum.length; b++) {
    const f = 40 * (12000 / 40) ** (b / (spectrum.length - 1))
    const harmonic = patch.wave === 'sine' ? (f < f0 * 1.5 ? 1 : 0.02) : patch.wave === 'sawtooth' ? f0 / f : 0.6 * (f0 / f)
    spectrum[b] = Math.min(1, harmonic * response(f, c) * amp * 1.4)
  }
}

const VERT_QUAD = `#version 300 es
in vec2 a_pos; out vec2 v_uv;
void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`
const VERT_LINE = `#version 300 es
in vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`
const FRAG_SOLID = `#version 300 es
precision mediump float; uniform vec4 u_color; out vec4 o; void main(){ o = u_color; }`
const FRAG_TUBE = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex; uniform vec2 u_res; uniform vec3 u_tint; uniform vec3 u_glass; uniform vec3 u_grid;
uniform float u_fft[${BINS}]; uniform float u_scan;
uniform float u_boot; uniform float u_off; uniform float u_flash; uniform float u_ripple; uniform float u_time; uniform float u_roll;
vec2 barrel(vec2 uv){ vec2 c = uv * 2.0 - 1.0; c *= 1.0 + 0.045 * dot(c, c); return c * 0.5 + 0.5; }
float tap(vec2 uv){ return texture(u_tex, uv).r; }
void main(){
  vec2 uv = barrel(v_uv);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }
  // the tube's aperture: closed to a dot, a line, then open (boot); closing again as the hero scrolls away (off)
  float ox = smoothstep(0.06, 0.3, u_boot) * (1.0 - smoothstep(0.62, 1.0, u_off));
  float oy = smoothstep(0.3, 0.62, u_boot) * (1.0 - smoothstep(0.0, 0.6, u_off));
  vec2 c0 = uv - 0.5;
  // a knob turn ripples the picture for a moment
  uv.y += sin(uv.x * 38.0 - u_time * 22.0) * 0.006 * u_ripple;
  vec2 px = 1.0 / u_res;
  float split = 1.6 + u_off * 18.0;
  float core = tap(uv);
  float fr = tap(uv + vec2(px.x * split, 0.0));
  float fb = tap(uv - vec2(px.x * split, 0.0));
  float bloom = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    vec2 d = vec2(cos(a), sin(a));
    bloom += tap(uv + d * px * 5.0) * 0.6 + tap(uv + d * px * 14.0) * 0.4;
  }
  bloom /= 8.0;
  // graticule: 10 x 8 divisions, a brighter centre cross
  vec2 g = abs(fract(uv * vec2(10.0, 8.0) - 0.5) - 0.5) / fwidth(uv * vec2(10.0, 8.0));
  float grid = 1.0 - min(min(g.x, g.y), 1.0);
  vec2 cc = abs(uv - 0.5) / fwidth(uv);
  float cross = 1.0 - min(min(cc.x, cc.y), 1.0);
  float ticks = step(abs(uv.y - 0.5), 0.006) * step(0.9, fract(uv.x * 50.0)) + step(abs(uv.x - 0.5), 0.004) * step(0.85, fract(uv.y * 40.0));
  // spectrum ghost
  int bin = int(clamp(uv.x * float(${BINS}), 0.0, float(${BINS} - 1)));
  float h = u_fft[bin] * 0.55;
  float bar = step(uv.y, h) * step(0.18, fract(uv.x * float(${BINS}))) * (0.35 + 0.65 * uv.y / max(h, 0.001));
  vec3 col = u_glass;
  col += u_grid * (grid * 0.55 + cross * 0.5 + ticks * 0.6);
  col += u_tint * bar * 0.16;
  vec3 trace = vec3(fr, core, fb);
  col += u_tint * (core * 1.05 + bloom * 1.35) + (trace - core) * u_tint * 0.6 + vec3(core * core * 0.35);
  col += u_tint * u_flash * 0.22;
  float scan = 0.88 + 0.12 * sin(uv.y * u_res.y * 3.14159 * u_scan);
  // a faint band rolling down the tube, and the slightest flicker
  float roll = 1.0 + u_roll * 0.05 * smoothstep(0.0, 0.06, fract(uv.y * 0.6 - u_time * 0.07)) * (1.0 - smoothstep(0.06, 0.14, fract(uv.y * 0.6 - u_time * 0.07)));
  float flicker = 1.0 + u_roll * 0.012 * sin(u_time * 113.0);
  vec2 vc = v_uv * 2.0 - 1.0;
  float vig = smoothstep(1.45, 0.35, length(vc * vec2(0.85, 1.0)));
  // warm-up: dim and unsteady until the phosphor settles
  float warm = mix(0.2, 1.0, smoothstep(0.55, 1.0, u_boot));
  float unsteady = 1.0 + 0.1 * sin(u_time * 70.0) * (1.0 - smoothstep(0.6, 1.0, u_boot));
  float mask = step(abs(c0.x), 0.5 * max(ox, 0.0015)) * step(abs(c0.y), 0.5 * max(oy, 0.0025));
  vec3 lit = col * scan * vig * roll * flicker * warm * unsteady * mask;
  // the bright line and dot while the aperture is thin
  float thin = ox * (1.0 - oy);
  lit += (u_tint * 1.4 + 0.6) * thin * exp(-abs(c0.y) * 520.0) * step(abs(c0.x), 0.5 * ox);
  float dot = (1.0 - ox) * (step(0.005, u_boot) * (1.0 - step(0.999, u_off)) + step(0.62, u_off) * (1.0 - step(0.999, u_off)));
  lit += (u_tint + 0.5) * dot * exp(-length(c0 * vec2(1.0, u_res.y / u_res.x)) * 90.0) * 1.6;
  o = vec4(lit, 1.0);
}`

function rgb(el: Element, name: string): [number, number, number] {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  el.appendChild(probe)
  const m = getComputedStyle(probe).color.match(/[\d.]+/g) ?? ['0', '0', '0']
  probe.remove()
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255]
}

/** gain: 1 for the OUT jack, 0.6 for PHONES, 0 when the cable is unplugged (the trace drops to a flat line). */
export function PhosphorScope({ reduced = false, gain = 1, offRef }: { reduced?: boolean; gain?: number; offRef?: { current: number } }): JSX.Element {
  const wrap = useRef<HTMLDivElement>(null)
  const gainRef = useRef(gain)
  gainRef.current = gain
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    const c = canvas.current
    const host = wrap.current
    if (!c || !host) return
    const gl = c.getContext('webgl2', { antialias: false, premultipliedAlpha: false })
    if (!gl) {
      setOk(false)
      return
    }
    setOk(true)
    const compile = (vs: string, fs: string): WebGLProgram => {
      const p = gl.createProgram()!
      for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        gl.attachShader(p, s)
      }
      gl.bindAttribLocation(p, 0, 'a_pos')
      gl.linkProgram(p)
      return p
    }
    const solid = compile(VERT_LINE, FRAG_SOLID)
    const quadSolid = compile(VERT_QUAD, FRAG_SOLID)
    const tube = compile(VERT_QUAD, FRAG_TUBE)
    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const lineBuf = gl.createBuffer()
    gl.enableVertexAttribArray(0)

    const tex = gl.createTexture()
    const fbo = gl.createFramebuffer()
    const size = (): void => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      c.width = Math.max(2, Math.round(c.clientWidth * dpr))
      c.height = Math.max(2, Math.round(c.clientHeight * dpr))
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, c.width, c.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(c)

    const tint = rgb(host, '--trace-1')
    const glass = rgb(host, '--scope-bg')
    const grid = rgb(host, '--scope-grid')
    const samples = new Float32Array(2048)
    const points = new Float32Array(N)
    const spectrum = new Float32Array(BINS)
    const freq = new Uint8Array(1024)
    const verts = new Float32Array(N * 4)
    let raf = 0
    let last = 0
    // the reactive state: boot start, the flash and ripple levels, what changed since the last frame
    const t0 = performance.now()
    let bootStart = reduced ? t0 - 10000 : t0
    let flash = 0
    let ripple = 0
    let lastNote: number | null = null
    let lastPatch = engine.getState().patch

    const draw = (now: number): void => {
      raf = requestAnimationFrame(draw)
      if (now - last < (reduced ? 1000 / 8 : 1000 / 60) - 2) return
      last = now
      const { status, patch, note } = engine.getState()
      const analyser = engine.getAnalyser()
      if (analyser && status === 'on') {
        analyser.getFloatTimeDomainData(samples)
        // trigger on a rising zero crossing so the trace stands still
        let s0 = 0
        for (let i = 1; i < samples.length - N * 2; i++) if (samples[i - 1] < 0 && samples[i] >= 0) { s0 = i; break }
        for (let i = 0; i < N; i++) points[i] = samples[s0 + i * 2] * 1.6
        analyser.getByteFrequencyData(freq)
        for (let b = 0; b < BINS; b++) {
          const f = 40 * (12000 / 40) ** (b / (BINS - 1))
          spectrum[b] = freq[Math.min(freq.length - 1, Math.round((f / (analyser.context.sampleRate / 2)) * freq.length))] / 255
        }
      } else preview(patch, note, now / 1000, points, spectrum)
      const g = gainRef.current
      if (g !== 1) {
        for (let i = 0; i < N; i++) points[i] *= g
        for (let b = 0; b < BINS; b++) spectrum[b] *= g
      }
      if (note !== lastNote && note !== null) flash = 1
      lastNote = note
      if (patch !== lastPatch) {
        const changed = (Object.keys(patch) as (keyof typeof patch)[]).filter((k) => patch[k] !== lastPatch[k])
        if (!reduced && (changed.includes('wave') || changed.length > 3)) bootStart = now - 0.55 * 1500 // re-sweep from the line
        else if (!reduced) ripple = Math.min(1, ripple + 0.35)
        lastPatch = patch
      }
      flash *= reduced ? 0.6 : 0.86
      ripple *= 0.9
      let sum = 0
      for (let i = 0; i < N; i++) sum += points[i] * points[i]
      level = Math.sqrt(sum / N)
      levelListeners.forEach((fn) => fn(level))

      // pass 1: fade the persistence buffer, then add the trace
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.viewport(0, 0, c.width, c.height)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(quadSolid)
      gl.uniform4f(gl.getUniformLocation(quadSolid, 'u_color'), 0, 0, 0, reduced ? 1 : 0.22)
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      const half = (Math.min(2, window.devicePixelRatio || 1) * 1.4) / c.height
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * 2 - 1
        const y = points[i] * 0.62
        const yp = points[Math.max(0, i - 1)] * 0.62
        const yn = points[Math.min(N - 1, i + 1)] * 0.62
        const dx = 4 / (N - 1)
        const dy = yn - yp
        const len = Math.hypot(dx * (c.width / c.height), dy) || 1
        const nx = (-dy / len) * half * (c.height / c.width)
        const ny = ((dx * (c.width / c.height)) / len) * half
        verts.set([x - nx, y - ny, x + nx, y + ny], i * 4)
      }
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.useProgram(solid)
      gl.uniform4f(gl.getUniformLocation(solid, 'u_color'), 0.95, 0.95, 0.95, 1)
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf)
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, N * 2)

      // pass 2: the tube
      gl.disable(gl.BLEND)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, c.width, c.height)
      gl.useProgram(tube)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(gl.getUniformLocation(tube, 'u_tex'), 0)
      gl.uniform2f(gl.getUniformLocation(tube, 'u_res'), c.width, c.height)
      gl.uniform3f(gl.getUniformLocation(tube, 'u_tint'), ...tint)
      gl.uniform3f(gl.getUniformLocation(tube, 'u_glass'), ...glass)
      gl.uniform3f(gl.getUniformLocation(tube, 'u_grid'), ...grid)
      gl.uniform1f(gl.getUniformLocation(tube, 'u_scan'), 0.5)
      gl.uniform1fv(gl.getUniformLocation(tube, 'u_fft'), spectrum)
      gl.uniform1f(gl.getUniformLocation(tube, 'u_boot'), Math.min(1, (now - bootStart) / 1500))
      gl.uniform1f(gl.getUniformLocation(tube, 'u_off'), reduced ? 0 : Math.min(1, Math.max(0, offRef?.current ?? 0)))
      gl.uniform1f(gl.getUniformLocation(tube, 'u_flash'), flash)
      gl.uniform1f(gl.getUniformLocation(tube, 'u_ripple'), ripple)
      gl.uniform1f(gl.getUniformLocation(tube, 'u_time'), (now - t0) / 1000)
      gl.uniform1f(gl.getUniformLocation(tube, 'u_roll'), reduced ? 0 : 1)
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [reduced, offRef])

  return (
    <div ref={wrap} className="ph" role="img" aria-label="Oscilloscope showing the sound's waveform and spectrum">
      <svg className="ph__poster" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true" data-hidden={ok || undefined}>
        <path d="M0 100 L40 40 V160 L80 40 V160 L120 40 V160 L160 40 V160 L200 40 V160 L240 40 V160 L280 40 V160 L320 40 V160 L360 40 V160 L400 40" />
      </svg>
      <canvas ref={canvas} className="ph__canvas" />
    </div>
  )
}
