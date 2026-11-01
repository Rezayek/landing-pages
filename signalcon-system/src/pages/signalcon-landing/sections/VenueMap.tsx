/**
 * The district map for S6, drawn in the system's style: night ground, paper canals, the hall as an acid block with a
 * label plate, Tram 3 (paper, dashed), the night tram N3 (hot, dashed), a dotted walking line to Gate B. Inline SVG, no
 * external image. Colours, fonts and strokes are tokens in venue-faq.css (.vf-g-*); the numbers here are map units.
 *
 * One drawing, two crops: the tall one on phones (labels stay readable at 320 px) and from 1024 px (where the map
 * column matches the height of the info column beside it), the wide one between 640 and 1023 px.
 */
import { type JSX, useSyncExternalStore } from 'react'
import './venue-faq.css'

const WIDE = '(min-width: 640px) and (max-width: 1023px)'
const VIEW_WIDE = '0 0 640 400'
const VIEW_TALL = '120 -10 340 425'

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(WIDE)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const isWide = (): boolean => window.matchMedia(WIDE).matches

const range = (from: number, to: number, step: number): number[] => {
  const out: number[] = []
  for (let v = from; v <= to; v += step) out.push(v)
  return out
}

const LABEL = 'Map: the Relay Hall on Ferry Lane, two minutes from the Relay Hall tram stop. Gate B is step-free.'

export function VenueMap(): JSX.Element {
  const wide = useSyncExternalStore(subscribe, isWide, () => true)
  return (
    <svg
      className="vf-svg"
      viewBox={wide ? VIEW_WIDE : VIEW_TALL}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={LABEL}
      focusable="false"
    >
      <rect className="vf-g-ground" x={-400} y={-400} width={1600} height={1200} />

      {/* street grid and blocks */}
      <g className="vf-g-grid">
        {range(-70, 700, 70).map((x) => (
          <line key={`v${x}`} x1={x} y1={-400} x2={x} y2={800} />
        ))}
        {range(-56, 460, 56).map((y) => (
          <line key={`h${y}`} x1={-400} y1={y} x2={1200} y2={y} />
        ))}
      </g>
      <g className="vf-g-block">
        <rect x={150} y={18} width={110} height={50} />
        <rect x={470} y={28} width={90} height={70} />
        <rect x={20} y={110} width={110} height={80} />
        <rect x={500} y={120} width={100} height={70} />
        <rect x={130} y={362} width={110} height={36} />
        <rect x={300} y={366} width={100} height={30} />
      </g>

      {/* canals: paper strokes on a night-600 edge */}
      <g>
        <path className="vf-g-canal-edge" d="M -20 340 C 150 320, 260 360, 400 335 S 600 305, 680 325" />
        <path className="vf-g-canal-edge" d="M 560 -20 C 550 100, 580 200, 575 322" />
        <path className="vf-g-canal-edge" d="M 70 -20 C 80 100, 60 200, 75 332" />
        <path className="vf-g-canal" d="M -20 340 C 150 320, 260 360, 400 335 S 600 305, 680 325" />
        <path className="vf-g-canal" d="M 560 -20 C 550 100, 580 200, 575 322" />
        <path className="vf-g-canal" d="M 70 -20 C 80 100, 60 200, 75 332" />
      </g>

      {/* Ferry Lane */}
      <path className="vf-g-road-edge" d="M -20 237 L 680 237" />
      <path className="vf-g-road" d="M -20 237 L 680 237" />
      <text className="vf-g-text" data-tone="muted" x={360} y={306} fontSize={12} textAnchor="middle">
        FERRY LANE
      </text>

      {/* Tram 3 (paper) and the night tram N3 (hot) */}
      <path className="vf-g-tram" d="M -20 225 L 680 225" />
      <path className="vf-g-night" d="M 450 -20 L 450 249 L -20 249" strokeLinejoin="round" />

      {/* the hall */}
      <rect className="vf-g-hall-edge" x={279} y={104} width={132} height={86} rx={4} />
      <rect className="vf-g-hall" x={285} y={110} width={120} height={74} rx={2} />

      {/* the walk from the stop to Gate B */}
      <path className="vf-g-walk" d="M 200 237 L 200 202 L 345 202 L 345 190" />
      <text className="vf-g-text" data-tone="acid" x={244} y={195} fontSize={11} textAnchor="middle">
        2 MIN
      </text>

      {/* the stop */}
      <circle className="vf-g-stop" cx={200} cy={237} r={10} />
      <rect className="vf-g-plate" data-tone="paper" x={127} y={272} width={146} height={22} rx={3} />
      <text className="vf-g-text" data-tone="night" x={200} y={287} fontSize={12} textAnchor="middle">
        RELAY HALL STOP
      </text>

      {/* gates */}
      <rect className="vf-g-gate" x={279} y={141} width={12} height={12} />
      <text className="vf-g-text" data-tone="paper" x={272} y={151} fontSize={12} textAnchor="end">
        GATE A
      </text>
      <rect className="vf-g-gate" x={339} y={178} width={12} height={12} />
      <text className="vf-g-text" data-tone="night" x={345} y={172} fontSize={11} textAnchor="middle">
        GATE B
      </text>

      {/* label plates */}
      <rect className="vf-g-plate" data-tone="night" x={293} y={124} width={104} height={22} rx={3} />
      <text className="vf-g-text" data-tone="acid" x={345} y={139} fontSize={13} textAnchor="middle">
        RELAY HALL
      </text>
      <rect className="vf-g-plate" data-tone="paper" x={122} y={186} width={60} height={18} rx={3} />
      <text className="vf-g-text" data-tone="night" x={152} y={199} fontSize={11} textAnchor="middle">
        TRAM 3
      </text>
      <rect className="vf-g-plate" data-tone="hot" x={313} y={58} width={128} height={20} rx={3} />
      <text className="vf-g-text" data-tone="night" x={377} y={72} fontSize={12} textAnchor="middle">
        N3 NIGHT TRAM
      </text>
    </svg>
  )
}

export default VenueMap
