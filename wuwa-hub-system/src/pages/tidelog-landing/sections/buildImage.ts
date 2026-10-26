/**
 * "Save build image" (agreed round 4, D1): the shared build drawn in the browser as a share-sized card (1200×630), in
 * the page's own colours and type: her key art, the five Echoes with their icons and main stats, the cost and crit
 * totals, "Sample build", the Echo Atlas mark with the address it came from, and the credit line. Nothing is uploaded; the PNG is handed to the browser to save.
 */
import { COST_LIMIT, costOf, echoOf, statsOf, type BuildSlot } from './data'

const W = 1200
const H = 630

const load = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

/** The colours and faces come from the page's tokens, read off the element they apply to. */
function tokens(from: Element): Record<'bg' | 'surface' | 'ink' | 'muted' | 'accent' | 'line' | 'display' | 'body', string> {
  const s = getComputedStyle(from)
  const v = (name: string): string => s.getPropertyValue(name).trim()
  return {
    bg: v('--band-bg'),
    surface: v('--band-surface'),
    ink: v('--band-ink'),
    muted: v('--band-muted'),
    accent: v('--band-accent'),
    line: v('--band-line'),
    display: v('--font-display'),
    body: v('--font-body'),
  }
}

/** A notched plate outline, the contract's frame: the top-right corner cut. */
function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, notch: number): void {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w - notch, y)
  ctx.lineTo(x + w, y + notch)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
}

export async function drawBuildImage(slots: readonly BuildSlot[], from: Element, address: string): Promise<Blob> {
  await document.fonts?.ready
  const t = tokens(from)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')

  // the stage: the key art, cover-fitted and set right, under a night fade from the left
  ctx.fillStyle = t.bg
  ctx.fillRect(0, 0, W, H)
  const art = await load('/resonators/art/jinhsi-moonlit.webp')
  if (art) {
    const scale = Math.max(W / art.naturalWidth, H / art.naturalHeight) * 1.05
    const dw = art.naturalWidth * scale
    const dh = art.naturalHeight * scale
    ctx.drawImage(art, W - dw + 40, (H - dh) / 2, dw, dh)
  }
  const fade = ctx.createLinearGradient(0, 0, W, 0)
  fade.addColorStop(0, t.bg)
  fade.addColorStop(0.42, t.bg)
  fade.addColorStop(0.68, 'transparent')
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, W, H)

  // the card's frame
  ctx.strokeStyle = t.accent
  ctx.lineWidth = 2
  plate(ctx, 20, 20, W - 40, H - 40, 28)
  ctx.stroke()

  // the brand (round 5, C3): the mark, the wordmark and the address the card came from, top right on a night strip
  ctx.textBaseline = 'alphabetic'
  const word = 'ECHO ATLAS'
  ctx.font = `700 26px ${t.display}`
  const ww = ctx.measureText(word).width
  ctx.font = `400 15px ${t.body}`
  const aw = ctx.measureText(address).width
  const right = W - 56
  const left = right - Math.max(ww + 52, aw)
  ctx.fillStyle = t.bg
  ctx.globalAlpha = 0.85
  ctx.fillRect(left - 14, 44, right - left + 28, 88)
  ctx.globalAlpha = 1
  // the mark's paths (Shell.tsx Mark): the notched plate in gold, the A and its wave cut out of it
  ctx.save()
  ctx.translate(right - ww - 52, 52)
  ctx.scale(40 / 24, 40 / 24)
  ctx.fillStyle = t.accent
  ctx.fill(new Path2D('M2 2h15l5 5v15H2z'))
  ctx.strokeStyle = t.bg
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D('M6.5 19 12 5.5 17.5 19'))
  ctx.stroke(new Path2D('M7.6 14.2c1.4 0 1.8-1.6 3-1.6s1.6 1.6 2.8 1.6 1.7-1.6 3-1.6'))
  ctx.restore()
  ctx.textAlign = 'right'
  ctx.fillStyle = t.ink
  ctx.font = `700 26px ${t.display}`
  ctx.fillText(word, right, 82)
  ctx.fillStyle = t.muted
  ctx.font = `400 15px ${t.body}`
  ctx.fillText(address, right, 116)
  ctx.textAlign = 'left'

  // heading
  ctx.fillStyle = t.accent
  ctx.font = `600 20px ${t.body}`
  ctx.fillText('Sample build', 64, 84)
  ctx.fillStyle = t.ink
  ctx.font = `700 64px ${t.display}`
  ctx.fillText('JINHSI', 62, 148)
  const stats = statsOf(slots)
  ctx.fillStyle = t.muted
  ctx.font = `400 22px ${t.body}`
  ctx.fillText(`Celestial Light ${stats.set}/5 · Cost ${costOf(slots)}/${COST_LIMIT}`, 64, 186)

  // the five Echoes
  const icons = await Promise.all(slots.map((s) => { const e = echoOf(s); return e.icon ? load(`/game/${e.icon}.webp`) : Promise.resolve(null) }))
  slots.forEach((s, i) => {
    const e = echoOf(s)
    const y = 218 + i * 62
    ctx.fillStyle = t.surface
    plate(ctx, 64, y, 440, 52, 10)
    ctx.fill()
    ctx.strokeStyle = t.line
    ctx.lineWidth = 1
    ctx.stroke()
    const icon = icons[i]
    if (icon) ctx.drawImage(icon, 72, y + 4, 44, 44)
    ctx.fillStyle = t.accent
    ctx.font = `700 16px ${t.display}`
    ctx.fillText(String(e.cost), 126, y + 22)
    ctx.fillStyle = t.ink
    ctx.font = `600 20px ${t.body}`
    ctx.fillText(e.name, 148, y + 23)
    ctx.fillStyle = t.muted
    ctx.font = `400 17px ${t.body}`
    ctx.fillText(`${e.main[0]} ${e.main[1]}`, 148, y + 44)
  })

  // the totals, in the numeral face
  const totals: readonly (readonly [string, string])[] = [
    ['Crit Rate', `${stats.critRate}%`],
    ['Crit DMG', `${stats.critDmg}%`],
  ]
  totals.forEach(([label, value], i) => {
    const x = 64 + i * 220
    ctx.fillStyle = t.muted
    ctx.font = `400 18px ${t.body}`
    ctx.fillText(label, x, 556)
    ctx.fillStyle = t.ink
    ctx.font = `700 40px ${t.display}`
    ctx.fillText(value, x, 596)
  })

  // credit, on a night strip so it reads over the art
  const credit = 'Art © Kuro Games · Echo Atlas, an unofficial fan project'
  ctx.font = `400 15px ${t.body}`
  const cw = ctx.measureText(credit).width
  ctx.fillStyle = t.bg
  ctx.globalAlpha = 0.85
  ctx.fillRect(W - 48 - cw - 12, H - 62, cw + 24, 30)
  ctx.globalAlpha = 1
  ctx.fillStyle = t.ink
  ctx.textAlign = 'right'
  ctx.fillText(credit, W - 48, H - 42)

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no image'))), 'image/png'))
}

/** Hands the PNG to the browser to save. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.append(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
