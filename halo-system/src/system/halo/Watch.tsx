/**
 * The HALO watch, drawn in code: the stand-in for the Blender renders until they exist (DESIGN.md §Sources). A 1:1
 * titanium case with 26% corners, a square display inside the round halo ring, a flat knurled dial wheel set in a
 * slot on the right with an orange index, and the sport band. Two views: `front` and `dial` (the right side).
 *
 * Product colours (finish, band) come from data.ts: they are the product's, not UI roles. The face is real product
 * UI in the system's face and figures.
 */
import { useId, type JSX } from 'react'
import { BANDS, FACES, FINISHES, type Build } from './data'

export type WatchView = 'front' | 'dial'

export interface WatchProps {
  build: Build
  /** Index into FACES. */
  face?: number
  view?: WatchView
  /** Rendered width in px; the drawing is 2:3. */
  width?: number
  className?: string
}

const DIAL_INDEX = '#ff5a1f'

export function Watch({ build, face = 0, view = 'front', width = 220, className }: WatchProps): JSX.Element {
  const uid = useId().replace(/:/g, '')
  const finish = FINISHES.find((f) => f.id === build.finish) ?? FINISHES[0]
  const band = BANDS.find((b) => b.id === build.band) ?? BANDS[0]
  const scale = build.size === '41' ? 0.92 : 1
  const f = FACES[Math.max(0, Math.min(FACES.length - 1, face))]
  const ring = 2 * Math.PI * 44
  const [m0, m1, m2] = finish.metal

  return (
    <svg
      className={className}
      viewBox="0 0 220 330"
      width={width}
      height={width * 1.5}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`ti-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m0} />
          <stop offset="0.48" stopColor={m1} />
          <stop offset="1" stopColor={m2} />
        </linearGradient>
        <linearGradient id={`band-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={band.hex} />
          <stop offset="1" stopColor={band.hex} />
        </linearGradient>
        <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
        <radialGradient id={`key-${uid}`} cx="0.28" cy="0.2" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(110 165) scale(${scale}) translate(-110 -165)`}>
        {view === 'front' ? (
          <>
            {/* band, top and bottom, with the key light falling left to right */}
            <rect x="62" y="0" width="96" height="104" rx="12" fill={`url(#band-${uid})`} />
            <rect x="62" y="0" width="96" height="104" rx="12" fill={`url(#shade-${uid})`} />
            <rect x="62" y="226" width="96" height="104" rx="12" fill={`url(#band-${uid})`} />
            <rect x="62" y="226" width="96" height="104" rx="12" fill={`url(#shade-${uid})`} />
            <g fill="#000" fillOpacity="0.2">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <rect key={i} x="104" y={252 + i * 10} width="12" height="4" rx="2" />
              ))}
            </g>
            {/* the dial wheel in its slot on the right */}
            <rect x="176" y="139" width="12" height="52" rx="4" fill={`url(#ti-${uid})`} />
            <g stroke="#000" strokeOpacity="0.28" strokeWidth="1.3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <line key={i} x1="178" x2="188" y1={143 + i * 5.5} y2={143 + i * 5.5} />
              ))}
            </g>
            <rect x="184" y="160" width="4.5" height="10" rx="1" fill={DIAL_INDEX} />
            {/* the case, 1:1, corners at 26% of its side */}
            <rect x="38" y="93" width="144" height="144" rx="37" fill={`url(#ti-${uid})`} />
            <rect x="38" y="93" width="144" height="144" rx="37" fill={`url(#key-${uid})`} />
            <rect x="38.75" y="93.75" width="142.5" height="142.5" rx="36.5" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" />
            {/* the display and its halo ring */}
            <rect x="48" y="103" width="124" height="124" rx="27" fill="#050506" />
            <circle cx="110" cy="165" r="44" fill="none" stroke="#232326" strokeWidth="5" />
            <circle
              cx="110"
              cy="165"
              r="44"
              fill="none"
              stroke={DIAL_INDEX}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${ring * f.ring} ${ring}`}
              transform="rotate(-90 110 165)"
            />
            <text x="110" y="172" textAnchor="middle" fill="#f4f4f1" fontFamily="var(--font-display)" fontWeight="400" fontSize="25" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {f.value}
            </text>
            <text x="110" y="189" textAnchor="middle" fill="#a6a8ac" fontFamily="var(--font-body)" fontSize="9">
              {f.unit}
            </text>
          </>
        ) : (
          <>
            {/* the right side: the band curving away, the case's edge and the dial wheel proud of it */}
            <path d="M92 0h36v86c0 6-3 10-8 12H100c-5-2-8-6-8-12z" fill={band.hex} />
            <path d="M92 330h-0V244c0-6 3-10 8-12h20c5 2 8 6 8 12v86z" fill={band.hex} />
            <path d="M92 0h36v86c0 6-3 10-8 12H100c-5-2-8-6-8-12z" fill={`url(#shade-${uid})`} />
            <rect x="80" y="93" width="60" height="144" rx="16" fill={`url(#ti-${uid})`} />
            <rect x="80" y="93" width="60" height="144" rx="16" fill={`url(#key-${uid})`} />
            <rect x="84" y="97" width="10" height="136" rx="5" fill="#050506" opacity="0.6" />
            <rect x="96" y="131" width="40" height="68" rx="8" fill={m1} />
            <rect x="99" y="134" width="34" height="62" rx="6" fill={`url(#ti-${uid})`} />
            <g stroke="#000" strokeOpacity="0.3" strokeWidth="1.4">
              {Array.from({ length: 11 }, (_, i) => (
                <line key={i} x1="101" x2="131" y1={138 + i * 5.3} y2={138 + i * 5.3} />
              ))}
            </g>
            <rect x="99" y="162" width="34" height="5" rx="1.5" fill={DIAL_INDEX} />
            <rect x="104" y="210" width="24" height="10" rx="3" fill={m1} />
          </>
        )}
      </g>
    </svg>
  )
}
