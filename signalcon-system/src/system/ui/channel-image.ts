/**
 * Draws a channel card as a 1080 × 1350 PNG (4:5, the portrait size most feeds take) on a canvas: the same band,
 * art, ON AIR tape, name plate and sign-off as ChannelCard, with CRT scanlines over the art. Colours are read from the
 * live tokens and the type waits for the page's own fonts, so the image matches the card. Loaded only when someone
 * saves a card (COMPONENTS.md §Channel card).
 */
import type { ChannelTone } from './channel'

export interface ChannelImageSpec {
  channel: string
  tone: ChannelTone
  /** the portrait's URL (same origin, so the canvas stays readable) */
  image: string
  onAir: string
  name: string
  role: string
  dates: string
  place: string
}

const W = 1080
const H = 1350
const PAD = 56
const CUT = 96
const RADIUS = 40
const BAND = 104
const PLATE = 300
const FOOT = 140
const ART = H - BAND - PLATE - FOOT

const DISPLAY = '"Archivo Variable", "Archivo Fallback Arial", sans-serif'
const BODY = '"Instrument Sans Variable", "Instrument Sans Fallback", sans-serif'
const MONO = '"Martian Mono Variable", ui-monospace, monospace'

type Ctx = CanvasRenderingContext2D

function tokens(): Record<string, string> {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string): string => css.getPropertyValue(name).trim()
  return {
    night: v('--night-950'),
    paper: v('--paper-50'),
    signal: v('--signal'),
    onSignal: v('--on-signal'),
    accent: v('--accent'),
    onAccent: v('--on-accent'),
    cyan: v('--cyan-split'),
    muted: v('--muted'),
    subtle: v('--subtle'),
    line: v('--line-strong'),
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The portrait did not load.'))
    img.src = src
  })
}

function setFont(ctx: Ctx, font: string, stretch: string, spacing = '0px'): void {
  ctx.font = font
  // both are newer canvas properties; a browser without them draws at the normal width and spacing
  const c = ctx as unknown as Record<string, unknown>
  if ('fontStretch' in ctx) c.fontStretch = stretch
  if ('letterSpacing' in ctx) c.letterSpacing = spacing
}

/** The card's outline: rounded corners, the one cut corner top right. */
function outline(ctx: Ctx, inset: number): void {
  const x0 = inset
  const y0 = inset
  const x1 = W - inset
  const y1 = H - inset
  const r = RADIUS - inset
  ctx.beginPath()
  ctx.moveTo(x0 + r, y0)
  ctx.lineTo(x1 - CUT, y0)
  ctx.lineTo(x1, y0 + CUT)
  ctx.arcTo(x1, y1, x1 - r, y1, r)
  ctx.arcTo(x0, y1, x0, y1 - r, r)
  ctx.arcTo(x0, y0, x0 + r, y0, r)
  ctx.closePath()
}

/** Greedy wrap that may break after a space or a hyphen; shrinks the size until the name fits two lines. */
function fitName(ctx: Ctx, name: string, max: number): { lines: string[]; size: number } {
  const parts = name.toUpperCase().split(/(?<=[\s-])/)
  for (let size = 104; size >= 60; size -= 4) {
    setFont(ctx, `italic 900 ${size}px ${DISPLAY}`, 'extra-condensed')
    const lines: string[] = []
    let line = ''
    for (const part of parts) {
      const next = line + part
      if (line && ctx.measureText(next.trimEnd()).width > max) {
        lines.push(line.trimEnd())
        line = part
      } else line = next
    }
    lines.push(line.trimEnd())
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= max)) return { lines, size }
  }
  return { lines: [name.toUpperCase()], size: 60 }
}

export async function renderChannelCard(spec: ChannelImageSpec): Promise<Blob> {
  const t = tokens()
  const tone = { signal: [t.signal, t.onSignal], acid: [t.accent, t.onAccent], cyan: [t.cyan, t.night] }[spec.tone]
  const tape = spec.tone === 'signal' ? [t.accent, t.onAccent] : [t.signal, t.onSignal]
  await Promise.all(
    [`italic 900 64px ${DISPLAY}`, `700 32px ${MONO}`, `400 32px ${MONO}`, `400 36px ${BODY}`].map((f) => document.fonts.load(f)),
  )
  const img = await loadImage(spec.image)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d') as Ctx | null
  if (!ctx) throw new Error('This browser cannot draw the card.')

  ctx.save()
  outline(ctx, 0)
  ctx.clip()
  ctx.fillStyle = t.night
  ctx.fillRect(0, 0, W, H)

  // band: channel (with the RGB split) and the event
  ctx.fillStyle = tone[0]
  ctx.fillRect(0, 0, W, BAND)
  setFont(ctx, `700 38px ${MONO}`, 'semi-condensed', '1.5px')
  ctx.textBaseline = 'middle'
  const by = BAND / 2 + 2
  ctx.globalAlpha = 0.55
  ctx.fillStyle = t.cyan
  ctx.fillText(spec.channel, PAD - 3, by)
  ctx.fillStyle = t.signal
  ctx.fillText(spec.channel, PAD + 3, by)
  ctx.globalAlpha = 1
  ctx.fillStyle = tone[1]
  ctx.fillText(spec.channel, PAD, by)
  ctx.textAlign = 'right'
  ctx.fillText('SIGNAL//CON 2027', W - CUT - 24, by)
  ctx.textAlign = 'left'

  // art: cover crop, faces sit high, then the scanlines
  const scale = Math.max(W / img.naturalWidth, ART / img.naturalHeight)
  const sw = W / scale
  const sh = ART / scale
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) * 0.3
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, BAND, W, ART)
  ctx.fillStyle = 'rgb(0 0 0 / 0.16)' // taste-skill-ignore: CRT scanlines over the art, style contract device
  for (let y = BAND; y < BAND + ART; y += 6) ctx.fillRect(0, y, W, 2)

  // ON AIR tape, tilted, with a torn edge
  const tapeText = `ON AIR · ${spec.onAir.toUpperCase()}`
  setFont(ctx, `italic 900 46px ${DISPLAY}`, 'condensed')
  const tw = ctx.measureText(tapeText).width + 48
  const th = 70
  ctx.save()
  ctx.translate(PAD - 8, BAND + ART - 64)
  ctx.rotate((-4 * Math.PI) / 180)
  ctx.beginPath()
  ctx.moveTo(0, th * 0.08)
  ctx.lineTo(tw * 0.03, 0)
  ctx.lineTo(tw * 0.97, th * 0.04)
  ctx.lineTo(tw, 0)
  ctx.lineTo(tw * 0.99, th)
  ctx.lineTo(tw * 0.96, th * 0.92)
  ctx.lineTo(tw * 0.02, th)
  ctx.lineTo(0, th * 0.9)
  ctx.closePath()
  ctx.fillStyle = tape[0]
  ctx.fill()
  ctx.fillStyle = tape[1]
  ctx.textBaseline = 'middle'
  ctx.fillText(tapeText, 24, th / 2 + 3)
  ctx.restore()

  // name plate: the name sits on the plate's lower edge, over two lines' height
  const py = BAND + ART
  ctx.fillStyle = t.paper
  ctx.fillRect(0, py, W, 8)
  const { lines, size } = fitName(ctx, spec.name, W - PAD * 2)
  setFont(ctx, `italic 900 ${size}px ${DISPLAY}`, 'extra-condensed')
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = t.paper
  const lineH = size * 0.9
  const nameBottom = py + PLATE - 96
  lines.forEach((l, i) => ctx.fillText(l, PAD, nameBottom - (lines.length - 1 - i) * lineH))
  setFont(ctx, `400 36px ${BODY}`, 'normal')
  ctx.fillStyle = t.muted
  ctx.fillText(spec.role, PAD, nameBottom + 56)

  // sign-off: dashed rule, wordmark, dates and place
  const fy = H - FOOT
  ctx.strokeStyle = t.line
  ctx.lineWidth = 3
  ctx.setLineDash([12, 10])
  ctx.beginPath()
  ctx.moveTo(0, fy)
  ctx.lineTo(W, fy)
  ctx.stroke()
  ctx.setLineDash([])
  setFont(ctx, `italic 900 54px ${DISPLAY}`, 'condensed')
  ctx.textBaseline = 'middle'
  const wy = fy + FOOT / 2
  let wx = PAD
  for (const [text, color] of [['SIGNAL', t.paper], ['//', t.accent], ['CON', t.paper]] as const) {
    ctx.fillStyle = color
    ctx.fillText(text, wx, wy)
    wx += ctx.measureText(text).width
  }
  setFont(ctx, `400 30px ${MONO}`, 'semi-condensed', '1.2px')
  ctx.fillStyle = t.subtle
  ctx.textAlign = 'right'
  ctx.fillText(spec.dates, W - PAD, wy - 22)
  ctx.fillText(spec.place.toUpperCase(), W - PAD, wy + 22)
  ctx.textAlign = 'left'
  ctx.restore()

  // the ink outline over everything
  ctx.strokeStyle = t.paper
  ctx.lineWidth = 12
  outline(ctx, 6)
  ctx.stroke()

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The card image could not be made.'))), 'image/png'),
  )
}
