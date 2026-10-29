/**
 * The watch face, drawn on a canvas and used as the display's texture: real product UI, in the system's face and
 * figures. One canvas, redrawn only when the mode or its progress changes (a heart-rate line drawing in, the night
 * face dimming, a notification sliding up).
 */
import { CanvasTexture, SRGBColorSpace } from 'three'

export type FaceMode = 'time' | 'run' | 'sleep' | 'swim' | 'notify' | 'figure' | 'off'

export interface FaceState {
  mode: FaceMode
  /** 0-1 progress inside the mode: the heart line drawn, the dim, the notification's arrival. */
  t: number
  /** The halo ring's lit share on the Time face (today's training against the goal); 0.62 when left out. */
  ring?: number
  /** The figure face (the configurator's dial): one large reading and its unit. */
  value?: string
  unit?: string
}

const SIZE = 1024
/** The canvas is drawn at 1.5× its layout size, so the figures stay crisp in a close-up. */
const SCALE = 1.5
const ORANGE = '#ff5a1f'
const INK = '#f4f4f1'
const MUTED = '#a6a8ac'
/** The panel's corner radius in texture pixels: (display radius - inset) / (display width - inset) × size. */
const CORNER = Math.round(((0.86 - 0.12) / (3.86 - 0.24)) * SIZE)
const FONT = "'Host Grotesk Variable', 'Host Grotesk', 'Host Grotesk Fallback', Arial, sans-serif"

/** A recorded interval session (illustrative): heart rate over 40 minutes, rising through the zones. */
const HEART = [118, 124, 131, 138, 146, 152, 161, 167, 170, 164, 158, 166, 171, 174, 168, 160, 166, 172, 176, 168, 162, 150, 141, 132]

export function createFace(): { texture: CanvasTexture; draw: (state: FaceState) => void } {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE * SCALE
  canvas.height = SIZE * SCALE
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  let last = ''
  const current: FaceState = { mode: 'time', t: 0, ring: 0.62 }

  function ring(share: number, colour: string, alpha = 1): void {
    const c = SIZE / 2
    ctx.lineCap = 'round'
    ctx.lineWidth = 34
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'
    ctx.beginPath()
    ctx.arc(c, c, 330, 0, Math.PI * 2)
    ctx.stroke()
    if (share <= 0) return
    ctx.globalAlpha = alpha
    ctx.strokeStyle = colour
    ctx.beginPath()
    ctx.arc(c, c, 330, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  function text(value: string, y: number, size: number, colour: string, weight = 400, align: CanvasTextAlign = 'center', x = SIZE / 2): void {
    ctx.fillStyle = colour
    ctx.font = `${weight} ${size}px ${FONT}`
    ctx.textAlign = align
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(value, x, y)
  }

  function draw(state: FaceState): void {
    current.mode = state.mode
    current.t = state.t
    current.ring = state.ring
    current.value = state.value
    current.unit = state.unit
    const key = `${state.mode}:${state.t.toFixed(3)}:${(state.ring ?? 0.62).toFixed(3)}:${state.value ?? ''}:${state.unit ?? ''}`
    if (key === last) return
    last = key
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
    ctx.clearRect(0, 0, SIZE, SIZE)
    // the panel's own shape: a rounded square (the display's corner radius at this texture's scale)
    ctx.fillStyle = '#020203'
    roundRect(ctx, 0, 0, SIZE, SIZE, CORNER)
    ctx.fill()
    ctx.save()
    roundRect(ctx, 0, 0, SIZE, SIZE, CORNER)
    ctx.clip()
    const t = Math.max(0, Math.min(1, state.t))

    if (state.mode === 'off') {
      ctx.restore()
      texture.needsUpdate = true
      return
    }
    if (state.mode === 'time') {
      ring(state.ring ?? 0.62, ORANGE)
      text('7:42', 560, 230, INK, 400)
      text('Tue 28 · 14 days', 650, 52, MUTED)
    } else if (state.mode === 'run') {
      // the heart line draws in from the left as the run goes on; the value follows the last point
      const n = Math.max(2, Math.round(HEART.length * (0.15 + 0.85 * t)))
      const pts = HEART.slice(0, n)
      const x0 = 230, x1 = 794, y0 = 690, y1 = 430
      const sx = (i: number): number => x0 + ((x1 - x0) * i) / (HEART.length - 1)
      const sy = (v: number): number => y0 - ((v - 110) / 75) * (y0 - y1)
      ring(0.18 + 0.64 * t, ORANGE)
      text(`${pts[pts.length - 1]}`, 395, 150, INK, 400)
      text('bpm · Z4 threshold', 455, 44, MUTED)
      ctx.lineWidth = 9
      ctx.lineJoin = 'round'
      ctx.strokeStyle = ORANGE
      ctx.beginPath()
      pts.forEach((v, i) => (i ? ctx.lineTo(sx(i), sy(v)) : ctx.moveTo(sx(i), sy(v))))
      ctx.stroke()
      ctx.fillStyle = ORANGE
      ctx.beginPath()
      ctx.arc(sx(pts.length - 1), sy(pts[pts.length - 1]), 16, 0, Math.PI * 2)
      ctx.fill()
      text('4:12 /km', 790, 56, INK, 500)
    } else if (state.mode === 'sleep') {
      // the screen dims to a night face: red-shifted, low, the ring reads as the night's sleep
      const dim = 1 - 0.75 * t
      ctx.globalAlpha = dim
      ring(0.78, '#8a2b12', 0.9)
      text('6:45', 560, 210, '#c9a59a', 300)
      text('Alarm · sleep 7 h 12 min', 645, 46, '#8d7a74')
      ctx.globalAlpha = 1
    } else if (state.mode === 'figure') {
      // a face from the side dial: one reading, its unit, and the ring at that face's share
      ring(state.ring ?? 0.6, ORANGE)
      text(state.value ?? '', 560, 230, INK, 400)
      text(state.unit ?? '', 650, 52, MUTED)
    } else if (state.mode === 'swim') {
      ring(0.55, ORANGE)
      text('1:41', 540, 210, INK, 400)
      text('/100 m · lap 18', 620, 50, MUTED)
      text('1 800 m', 700, 46, MUTED)
    } else if (state.mode === 'notify') {
      ring(0.62, ORANGE, 0.35)
      text('7:42', 470, 170, 'rgba(244,244,241,0.35)', 400)
      // the message arrives from the bottom edge and settles
      const e = 1 - (1 - t) ** 3
      const y = 1024 - 430 * e
      ctx.fillStyle = '#2e2f33'
      roundRect(ctx, 150, y, 724, 300, 64)
      ctx.fill()
      ctx.fillStyle = ORANGE
      ctx.beginPath()
      ctx.arc(232, y + 92, 30, 0, Math.PI * 2)
      ctx.fill()
      text('Coach', y + 108, 56, INK, 500, 'left', 290)
      text('Last rep: hold 4:05,', y + 190, 48, INK, 400, 'left', 200)
      text('then jog it out.', y + 250, 48, INK, 400, 'left', 200)
    }
    ctx.restore()
    texture.needsUpdate = true
  }

  draw({ mode: 'time', t: 0 })
  // the canvas draws in the fallback face until Host Grotesk is ready; then the current state is drawn again
  // a canvas never asks for a font by itself: load the face's two weights, then draw again
  void Promise.all([400, 500, 300].map((w) => document.fonts?.load(`${w} 100px 'Host Grotesk Variable'`))).then(() => {
    last = ''
    draw(current)
  })
  return { texture, draw }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
