/**
 * The ground you dig through below the hero: one 16×16 pixel texture per layer (dirt, stone, stone with ores,
 * deepslate, bedrock), drawn once in code from the page tokens and set as CSS custom properties on the page root
 * (--bl-tex-<layer>). Sections paint them under a dark scrim (page.css), so text keeps its contrast.
 */
import { useEffect, type RefObject } from 'react'

type Layer = 'dirt' | 'stone' | 'ore' | 'deep' | 'bedrock'

function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function tile(tones: readonly string[], specks: readonly string[], seed: number): string {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 16
  const ctx = c.getContext('2d')
  if (!ctx) return 'none'
  const r = rng(seed)
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = tones[Math.floor(r() * tones.length)]
      ctx.fillRect(x, y, 1, 1)
    }
  // ore specks: small 2×2 clusters
  for (const colour of specks)
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(r() * 14)
      const y = Math.floor(r() * 14)
      ctx.fillStyle = colour
      ctx.fillRect(x, y, 2, 1)
      ctx.fillRect(x + (r() < 0.5 ? 0 : 1), y + 1, 1, 1)
    }
  return `url(${c.toDataURL()})`
}

export function useGroundTextures(root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const s = getComputedStyle(el)
    const t = (name: string): string => s.getPropertyValue(name).trim()
    const layers: Record<Layer, string> = {
      dirt: tile([t('--bl-dirt-1'), t('--bl-dirt-2'), t('--bl-dirt-3'), t('--bl-dirt-2')], [], 11),
      stone: tile([t('--bl-stone-2'), t('--bl-stone-3'), t('--bl-stone-2'), t('--bl-stone-1')], [t('--bl-deep-3')], 23),
      ore: tile([t('--bl-stone-2'), t('--bl-stone-3'), t('--bl-stone-3')], [t('--bl-deep-3'), t('--bl-plank-1'), t('--tier-rare')], 37),
      deep: tile([t('--bl-deep-1'), t('--bl-deep-2'), t('--bl-deep-2'), t('--bl-deep-3')], [t('--tier-rare')], 41),
      bedrock: tile([t('--bl-bedrock-1'), t('--bl-bedrock-2'), t('--bl-bedrock-3'), t('--bl-bedrock-3')], [], 53),
    }
    for (const [name, url] of Object.entries(layers)) el.style.setProperty(`--bl-tex-${name}`, url)
  }, [root])
}
