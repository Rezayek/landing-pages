import { useEffect, useRef, type CSSProperties, type JSX } from 'react'
import { TIER_SIZES, type Design } from './data'

const FINISH: Record<Design['finish'], { fill: string; shade: string; trim: string }> = {
  fondant: { fill: 'var(--cake-fondant)', shade: 'var(--cake-shade)', trim: 'var(--cake-stand)' },
  buttercream: { fill: 'var(--cake-buttercream)', shade: 'var(--cake-stand)', trim: 'var(--cake-stand)' },
  'semi-naked': { fill: 'color-mix(in srgb, var(--cake-crumb) 45%, var(--cake-buttercream))', shade: 'var(--cake-crumb)', trim: 'var(--cake-stand)' },
  naked: { fill: 'var(--cake-crumb)', shade: 'color-mix(in srgb, var(--cake-leaf) 25%, var(--cake-crumb))', trim: 'var(--cake-bead)' },
}

const PETALS = ['var(--cake-petal-1)', 'var(--cake-petal-2)', 'var(--cake-petal-3)']

/**
 * The cake as flat shapes: the poster the live 3D cake replaces, in the same composition, and the whole view without
 * WebGL or under Save-Data. Tiers newly added are marked so they settle down ('stack' in cake.css).
 */
export function Poster({ design, hidden }: { design: Design; hidden?: boolean }): JSX.Element {
  const sizes = TIER_SIZES[design.tiers] ?? TIER_SIZES[3]
  const prev = useRef<readonly number[]>(sizes)
  const before = prev.current
  useEffect(() => {
    prev.current = sizes
  })
  const finish = FINISH[design.finish]
  const base = sizes[sizes.length - 1]
  const widthOf = (size: number): string => `${(size / 14) * 64}%`
  const radius = design.shape === 'round' ? '10px' : design.shape === 'hexagon' ? '6px' : '2px'
  const flowersFor = (tierIndex: number, count: number): { left: string; top: string; size: string; petal: string }[] => {
    const out = []
    for (let i = 0; i < count; i++) out.push({ left: `${78 - i * 9}%`, top: `${8 + i * 26}%`, size: `${26 - i * 4}px`, petal: PETALS[(tierIndex + i) % PETALS.length] })
    return out
  }
  return (
    <div className="ms-poster ms-stand__poster" data-hidden={hidden || undefined} aria-hidden="true">
      <div className="ms-poster__cake" style={{ '--_base': widthOf(base), inlineSize: '100%' } as CSSProperties}>
        {design.flowers === 'crown' ? (
          <div style={{ position: 'relative', inlineSize: widthOf(sizes[0]), blockSize: '18px' }}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="ms-poster__flower" style={{ '--_s': '22px', '--_petal': PETALS[i % 3], insetInlineStart: `${i * 26}%`, insetBlockStart: '-4px' } as CSSProperties} />
            ))}
          </div>
        ) : null}
        {sizes.map((size, i) => {
          const isNew = !before.includes(size)
          const flowers =
            design.flowers === 'cascade' ? flowersFor(i, i === sizes.length - 1 ? 2 : 1) : design.flowers === 'spray' && i === 0 ? flowersFor(i, 2) : []
          return (
            <div
              key={size}
              className="ms-poster__tier"
              data-new={isNew || undefined}
              style={
                {
                  '--_w': widthOf(size),
                  '--_h': `${Math.min(64, 220 / sizes.length)}px`,
                  '--_r': radius,
                  '--_fill': finish.fill,
                  '--_shade': finish.shade,
                  '--_trim': finish.trim,
                } as CSSProperties
              }
            >
              {flowers.map((f, k) => (
                <span key={k} className="ms-poster__flower" style={{ '--_s': f.size, '--_petal': f.petal, insetInlineStart: f.left, insetBlockStart: f.top } as CSSProperties} />
              ))}
              {design.goldLeaf && i === Math.floor(sizes.length / 2) ? <span className="ms-poster__gold" style={{ insetInlineStart: '24%', insetBlockStart: '36%' }} /> : null}
            </div>
          )
        })}
        <span className="ms-poster__board" />
        <span className="ms-poster__foot" />
      </div>
    </div>
  )
}
