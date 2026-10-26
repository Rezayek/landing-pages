import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type JSX,
  type ReactNode,
  type RefObject,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  InlineMessage,
  LiveRegion,
  ProgressBar,
  Region,
  Skeleton,
  Spinner,
  ToastCard,
  ToastRegion,
  announce,
  toast,
  useAnnouncements,
  useToasts,
  type ActionPreview,
  type ToastTone,
} from './feedback'
import {
  DEFAULT_LATENCY,
  LATENCY_PRESETS,
  SimulatedFailure,
  isAbort,
  parseLatency,
  presetFor,
  simulate,
  wait,
  type LatencyId,
} from './latency'
import {
  COMPONENTS,
  CONTRAST_PAIRS,
  CONTRAST_SURFACES,
  CONTRAST_TEXT,
  PATTERNS,
  SECTIONS,
  SEQUENCES,
  TOKEN_GROUPS,
  TYPE_STEPS,
  type ComponentEntry,
  type PatternEntry,
  type SequenceEntry,
  type TokenGroup,
  type TokenName,
  type TokenSpec,
} from './registry'
import { SCENARIOS, SCENARIO_DEMOS, type Network, type Outcome } from './scenarios/Scenarios'
import { KITTY_DEMOS } from './ui/demos'
import './ui'
import './SystemPage.css'
// Kitty's two families (FOUNDATIONS.md §3), self-hosted, loaded with this route's chunk only.
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/inter'

/**
 * The living /system page: the design system shown working, from the real code and the real stylesheet.
 *
 * It renders from registry.ts: a token, component, sequence or pattern that is not listed there is not shown, and a
 * listed one with no demo in the tables below shows a warning. Phase 10 adds the entry and its demo together.
 *  - Tokens: every custom property in the registry, read from the live stylesheet; measured contrast; the type scale;
 *    the motion tokens, played.
 *  - Components: each in every state, drawn by the real component. Hover, focus and pressed are pinned by attributes.
 *  - Sequences: the real interactions, driven by the latency control, each marked `data-sequence="<id>"`.
 *  - Patterns: every empty state and the error pages.
 * `?latency=<fast|slow|very-slow|stalled|fail>` sets the control and runs each sequence once as it scrolls into
 * view, so a capture script can show any state without a click. The page is also the screenshot and axe source
 * for the critique phase, so keep it free of anything that is not the system.
 *
 * `scope` is the page slug when each page owns its system (systemScope "page"): tokens are then scoped to
 * [data-page="<slug>"], so the wrapper carries that attribute.
 */
export interface SystemPageProps {
  scope?: string
}

type ThemeChoice = 'system' | 'light' | 'dark'
type ContrastChoice = 'normal' | 'more'
type MotionChoice = 'system' | 'reduced'
type DensityChoice = 'comfortable' | 'compact'
type FrameChoice = 'full' | '320' | '768' | '1280'

const THEMES: readonly { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]
const CONTRASTS: readonly { id: ContrastChoice; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'more', label: 'More' },
]
const MOTIONS: readonly { id: MotionChoice; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'reduced', label: 'Reduced' },
]
const DENSITIES: readonly { id: DensityChoice; label: string }[] = [
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'compact', label: 'Compact' },
]
const FRAMES: readonly { id: FrameChoice; label: string }[] = [
  { id: 'full', label: 'Full' },
  { id: '320', label: '320' },
  { id: '768', label: '768' },
  { id: '1280', label: '1280' },
]

const vars = (values: Record<`--${string}`, string>): CSSProperties => values as unknown as CSSProperties
const noop = (): void => {}

/** What every demo receives. */
interface DemoProps {
  latency: LatencyId
  /** Run once when the demo scrolls into view (the page was opened with `?latency=`). */
  autorun: boolean
}

const ALL_TOKENS: readonly TokenName[] = [
  ...new Set<TokenName>([
    ...TOKEN_GROUPS.flatMap((group) => group.tokens.map((token) => token.name)),
    ...TYPE_STEPS.map((step) => step.token),
    ...CONTRAST_SURFACES.map((surface) => surface.token),
    ...CONTRAST_TEXT.map((rule) => rule.token),
    ...CONTRAST_PAIRS.flatMap((pair) => [pair.foreground, pair.background]),
  ]),
]

// ---------------------------------------------------------------------------------------------------------------
// Settings on <html> and the document: the same attributes tokens.css and feedback.css listen to.
// ---------------------------------------------------------------------------------------------------------------

function setRootAttribute(name: string, value: string | null): void {
  const root = document.documentElement
  if (value === null) root.removeAttribute(name)
  else root.setAttribute(name, value)
}

function readChoice<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = document.documentElement.getAttribute(name)
  return allowed.includes(value as T) ? (value as T) : fallback
}

function useMedia(query: string): boolean {
  const subscribe = useMemo(
    () => (notify: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Current computed values of the listed custom properties on `ref`, re-read when `refresh` changes. */
function useTokenValues(
  ref: RefObject<HTMLElement | null>,
  names: readonly TokenName[],
  refresh: number,
): Readonly<Record<string, string>> {
  const [values, setValues] = useState<Readonly<Record<string, string>>>({})
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const style = getComputedStyle(element)
    setValues(Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()])))
  }, [ref, names, refresh])
  return values
}

/** Runs `run` once, the first time `ref` is mostly in view. Does nothing unless `enabled`. */
function useAutorun(ref: RefObject<Element | null>, enabled: boolean, run: () => void): void {
  const latest = useRef(run)
  useEffect(() => {
    latest.current = run
  })
  useEffect(() => {
    const own = ref.current
    if (!enabled || !own) return
    // Inside a [data-autorun-scope] grid, every demo starts when any part of the grid enters view: a capture that
    // jumps to the section still sees each card run, even one it scrolled straight past.
    const scope = own.closest('[data-autorun-scope]')
    const element = scope ?? own
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        latest.current()
      },
      { threshold: scope ? 0 : 0.3 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled])
}

// ---------------------------------------------------------------------------------------------------------------
// Colour maths for the contrast section. Any CSS colour the browser understands (hex, rgb, oklch, color-mix) is
// resolved to sRGB through a 1x1 canvas.
// ---------------------------------------------------------------------------------------------------------------

type Rgba = readonly [number, number, number, number]
let probe: CanvasRenderingContext2D | null | undefined

function parseColor(value: string | undefined): Rgba | null {
  if (!value) return null
  if (probe === undefined) probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!probe) return null
  probe.fillStyle = '#010203'
  probe.fillStyle = value
  const first = probe.fillStyle
  probe.fillStyle = '#040506'
  probe.fillStyle = value
  if (first !== probe.fillStyle) return null // the browser did not understand it
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = value
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data
  return [r, g, b, a / 255]
}

const channel = (c: number): number => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = (c: Rgba): number => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2])

function contrastRatio(foreground: Rgba | null, background: Rgba | null): number | null {
  if (!foreground || !background || background[3] < 1) return null
  const a = foreground[3]
  const blended: Rgba = [
    foreground[0] * a + background[0] * (1 - a),
    foreground[1] * a + background[1] * (1 - a),
    foreground[2] * a + background[2] * (1 - a),
    1,
  ]
  const [lighter, darker] = [luminance(blended), luminance(background)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

// ---------------------------------------------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------------------------------------------

export default function SystemPage({ scope }: SystemPageProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [params, setParams] = useSearchParams()
  const [autorun] = useState(() => params.has('latency'))
  const latency = parseLatency(params.get('latency')) ?? DEFAULT_LATENCY
  const [theme, setTheme] = useState<ThemeChoice>(() => readChoice('data-theme', ['light', 'dark'], 'system'))
  // `?motion=reduced` turns the in-app reduced-motion switch on from the start, for reduced-motion captures.
  const [motion, setMotion] = useState<MotionChoice>(() => {
    if (params.get('motion') === 'reduced') setRootAttribute('data-motion', 'reduced')
    return readChoice('data-motion', ['reduced'], 'system')
  })
  const [contrast, setContrast] = useState<ContrastChoice>(() => readChoice('data-contrast', ['more'], 'normal'))
  const [density, setDensity] = useState<DensityChoice>('comfortable')
  const [frame, setFrame] = useState<FrameChoice>('full')
  const [revision, setRevision] = useState(0)
  const systemDark = useMedia('(prefers-color-scheme: dark)')
  const systemReduced = useMedia('(prefers-reduced-motion: reduce)')
  const reduced = motion === 'reduced' || systemReduced
  const values = useTokenValues(rootRef, ALL_TOKENS, revision * 4 + (systemDark ? 1 : 0) + (systemReduced ? 2 : 0))
  // An app that already mounts the announcer or the toast region at its root keeps just one of each.
  const [own] = useState(() => ({
    live: !document.querySelector('[data-live]'),
    toasts: !document.querySelector('[data-toasts]'),
  }))

  // Leave <html> as it was found when the person goes elsewhere.
  useEffect(() => {
    const root = document.documentElement
    const before = [root.getAttribute('data-theme'), root.getAttribute('data-motion'), root.getAttribute('data-contrast')] as const
    return () => {
      setRootAttribute('data-theme', before[0])
      setRootAttribute('data-motion', before[1])
      setRootAttribute('data-contrast', before[2])
    }
  }, [])

  // Keep a focused control clear of the sticky toolbar (--sticky-top feeds scroll-padding in tokens.css).
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const root = document.documentElement
    const measure = (): void => {
      const sticky = getComputedStyle(header).position === 'sticky'
      root.style.setProperty('--sticky-top', sticky ? `${header.offsetHeight}px` : '0px')
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--sticky-top')
    }
  }, [])

  function chooseTheme(next: ThemeChoice): void {
    setRootAttribute('data-theme', next === 'system' ? null : next)
    setTheme(next)
    setRevision((n) => n + 1)
  }
  function chooseContrast(next: ContrastChoice): void {
    setRootAttribute('data-contrast', next === 'normal' ? null : next)
    setContrast(next)
    setRevision((n) => n + 1)
  }
  function chooseMotion(next: MotionChoice): void {
    setRootAttribute('data-motion', next === 'system' ? null : next)
    setMotion(next)
    setRevision((n) => n + 1)
  }
  function chooseLatency(next: LatencyId): void {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current)
        copy.set('latency', next)
        return copy
      },
      { replace: true },
    )
  }

  return (
    <div
      className="fb sys"
      data-page={scope}
      data-density={density === 'compact' ? 'compact' : undefined}
      ref={rootRef}
    >
      <title>System · Kitty</title>
      <meta name="robots" content="noindex" />
      {own.live ? <LiveRegion /> : null}
      {own.toasts ? <ToastRegion /> : null}
      <header className="sys-header" ref={headerRef}>
        <div className="sys-header__inner">
          <div className="sys-title">
            <h1>Kitty system</h1>
            <p>
              {scope ? `The design system of page “${scope}”` : 'Every token, component and state of Kitty'}, running on its own code. People
              and amounts are sample data.
            </p>
          </div>
          <div className="sys-toolbar" role="toolbar" aria-label="Page settings">
            <Choice label="Theme" options={THEMES} value={theme} onChange={chooseTheme} />
            <Choice label="Contrast" options={CONTRASTS} value={contrast} onChange={chooseContrast} />
            <Choice label="Latency" options={LATENCY_PRESETS.map((item) => ({ id: item.id, label: item.label }))} value={latency} onChange={chooseLatency} />
            <details className="sys-more">
              <summary>More settings</summary>
              <div className="sys-toolbar">
                <Choice label="Reduced motion" options={MOTIONS} value={motion} onChange={chooseMotion} />
                <Choice label="Density" options={DENSITIES} value={density} onChange={setDensity} />
                <Choice label="Width" options={FRAMES} value={frame} onChange={setFrame} />
              </div>
            </details>
          </div>
          <p className="sys-group__hint">Latency: {presetFor(latency).hint}</p>
        </div>
      </header>
      <div className="sys-layout">
        <nav className="sys-nav" aria-label="Sections">
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <main className="sys-main">
          <div className="sys-frame" data-width={frame}>
            <TokensSection values={values} reduced={reduced} />
            <ContrastSection values={values} />
            <TypeSection values={values} />
            <ComponentsSection latency={latency} autorun={autorun} />
            <SequencesSection latency={latency} autorun={autorun} />
            <ScenariosSection latency={latency} autorun={autorun} onLatency={chooseLatency} />
            <PatternsSection latency={latency} autorun={autorun} />
          </div>
        </main>
      </div>
    </div>
  )
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (next: T) => void
  hint?: string
}): JSX.Element {
  return (
    <div className="sys-group" role="group" aria-label={label}>
      <span className="sys-group__label" aria-hidden="true">
        {label}
      </span>
      <div className="sys-seg">
        {options.map((option) => (
          <button key={option.id} type="button" aria-pressed={option.id === value} onClick={() => onChange(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      {hint ? <span className="sys-group__hint">{hint}</span> : null}
    </div>
  )
}

function Section({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children: ReactNode }): JSX.Element {
  const headingId = useId()
  return (
    <section id={id} className="sys-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {lead ? <p className="sys-lead">{lead}</p> : null}
      {children}
    </section>
  )
}

function Card({
  title,
  note,
  wide = false,
  children,
  ...rest
}: {
  title: string
  note?: ReactNode
  wide?: boolean
  children: ReactNode
  'data-sequence'?: string
}): JSX.Element {
  return (
    <div className={wide ? 'sys-card sys-card--wide' : 'sys-card'} {...rest}>
      <h3>{title}</h3>
      {note ? <p className="sys-note">{note}</p> : null}
      {children}
    </div>
  )
}

function Missing({ kind, id }: { kind: string; id: string }): JSX.Element {
  return (
    <InlineMessage tone="warning" title="No demo yet">
      “{id}” is listed in registry.ts as a {kind} but has no demo in SystemPage.tsx. A listed {kind} with no demo fails
      the build gate.
    </InlineMessage>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Tokens, contrast, type
// ---------------------------------------------------------------------------------------------------------------

type Values = Readonly<Record<string, string>>

function TokensSection({ values, reduced }: { values: Values; reduced: boolean }): JSX.Element {
  const defined = TOKEN_GROUPS.flatMap((group) => group.tokens).filter((token) => values[token.name]).length
  const total = TOKEN_GROUPS.reduce((count, group) => count + group.tokens.length, 0)
  const loaded = Object.keys(values).length > 0
  return (
    <Section
      id="tokens"
      title="Tokens"
      lead="Read from the live stylesheet, so a value that changes in tokens.css changes here. A token that is listed in registry.ts but not defined shows as not defined."
    >
      {loaded && defined === 0 ? (
        <InlineMessage tone="info" title="No tokens defined yet">
          The system writes its tokens in phase 6 (tokens.css in this folder). Until then the components use neutral
          fallbacks and every token below reads “not defined”.
        </InlineMessage>
      ) : (
        <p className="sys-note">
          {defined} of {total} listed tokens are defined.
        </p>
      )}
      {TOKEN_GROUPS.map((group) => (
        <TokenGroupView key={group.id} group={group} values={values} reduced={reduced} />
      ))}
    </Section>
  )
}

function TokenGroupView({ group, values, reduced }: { group: TokenGroup; values: Values; reduced: boolean }): JSX.Element {
  const headingId = useId()
  return (
    <div className="sys-subsection" role="group" aria-labelledby={headingId}>
      <div className="sys-group-title">
        <h3 id={headingId}>{group.title}</h3>
        {group.description ? <p className="sys-note">{group.description}</p> : null}
      </div>
      <ul className="sys-tokens">
        {group.tokens.map((token) => (
          <TokenRow key={token.name} token={token} value={values[token.name] ?? ''} />
        ))}
      </ul>
      {group.id === 'motion' ? <MotionPlayer group={group} reduced={reduced} /> : null}
    </div>
  )
}

function TokenRow({ token, value }: { token: TokenSpec; value: string }): JSX.Element {
  const name = token.name
  let preview: ReactNode = <span className="sys-glyph">{token.kind}</span>
  if (token.kind === 'color') preview = <span className="sys-swatch" style={vars({ '--sw': `var(${name})` })} />
  else if (token.kind === 'length') preview = <span className="sys-bar" style={{ inlineSize: `min(var(${name}), 100%)` }} />
  else if (token.kind === 'radius') preview = <span className="sys-corner" style={{ borderRadius: `var(${name})` }} />
  else if (token.kind === 'shadow') preview = <span className="sys-lift" style={{ boxShadow: `var(${name})` }} />
  return (
    <li className="sys-token">
      <span className="sys-token__preview" aria-hidden="true">
        {preview}
      </span>
      <span>
        <code className="sys-token__name">{name}</code>
        <code className="sys-token__value" data-missing={value ? undefined : 'true'}>
          {value || 'not defined'}
        </code>
        {token.note ? <span className="sys-note">{token.note}</span> : null}
      </span>
    </li>
  )
}

/** Plays each duration on the enter curve and each curve over the sheet duration. Reduced motion fades instead. */
function MotionPlayer({ group, reduced }: { group: TokenGroup; reduced: boolean }): JSX.Element {
  const [run, setRun] = useState(0)
  const rows = [
    ...group.tokens
      .filter((token) => token.kind === 'time')
      .map((token) => ({ token, d: `var(${token.name}, 200ms)`, e: 'var(--ease-enter, ease)' })),
    ...group.tokens
      .filter((token) => token.kind === 'easing')
      .map((token) => ({ token, d: 'var(--dur-sheet-in, 400ms)', e: `var(${token.name}, ease)` })),
  ]
  return (
    <div className="sys-motion" data-reduced={reduced}>
      <div className="sys-controls">
        <button type="button" className="sys-btn" onClick={() => setRun((n) => n + 1)}>
          Play
        </button>
        <span className="sys-note">
          {reduced ? 'Reduced motion is on: each one fades instead of travelling.' : 'Durations run on the enter curve; curves run over the sheet duration.'}
        </span>
      </div>
      {rows.map(({ token, d, e }) => (
        <div key={token.name} className="sys-motion__row">
          <code>{token.name}</code>
          <div className="sys-motion__track" aria-hidden="true">
            <span key={run} className="sys-motion__dot" data-run={run > 0 ? '' : undefined} style={vars({ '--d': d, '--e': e })} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Verdict({ ratio, minimum, compact = false }: { ratio: number | null; minimum: number; compact?: boolean }): JSX.Element {
  if (ratio === null) return <span className="sys-badge">not measured</span>
  const pass = ratio >= minimum
  return (
    <>
      <span>{ratio.toFixed(2)}:1</span>
      <span className="sys-badge" data-pass={pass}>
        {pass ? 'Pass' : 'Fail'}
        {compact ? '' : ` ${minimum}:1`}
      </span>
    </>
  )
}

function ContrastSection({ values }: { values: Values }): JSX.Element {
  const colour = (token: TokenName): Rgba | null => parseColor(values[token])
  const failing =
    CONTRAST_TEXT.reduce(
      (count, rule) =>
        count +
        CONTRAST_SURFACES.filter((surface) => {
          const ratio = contrastRatio(colour(rule.token), colour(surface.token))
          return ratio !== null && ratio < rule.minimum
        }).length,
      0,
    ) +
    CONTRAST_PAIRS.filter((pair) => {
      const ratio = contrastRatio(colour(pair.foreground), colour(pair.background))
      return ratio !== null && ratio < pair.minimum
    }).length
  return (
    <Section
      id="contrast"
      title="Contrast"
      lead="Measured from the values above, in the current theme. Text needs 4.5:1; large text and the parts of a control that identify it (its edge, its fill, the focus ring) need 3:1. Switch the theme to check the other one."
    >
      {Object.keys(values).length > 0 ? (
        failing > 0 ? (
          <InlineMessage tone="error" title={`${failing} failing ${failing === 1 ? 'pair' : 'pairs'}`}>
            Fix them in tokens.css, in both themes. They are marked “Fails” below.
          </InlineMessage>
        ) : (
          <p className="sys-note">No failing pair among the ones measured.</p>
        )
      ) : null}
      <div className="sys-scroll" role="region" tabIndex={0} aria-label="Contrast of each text role on each surface">
        <table className="sys-table">
          <thead>
            <tr>
              <th scope="col">Role</th>
              {CONTRAST_SURFACES.map((surface) => (
                <th key={surface.token} scope="col">
                  {surface.label}
                  <code>{surface.token}</code>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONTRAST_TEXT.map((rule) => (
              <tr key={rule.token}>
                <th scope="row">
                  {rule.label}
                  <code>
                    {rule.token} · needs {rule.minimum}:1
                  </code>
                </th>
                {CONTRAST_SURFACES.map((surface) => (
                  <td key={surface.token}>
                    <Verdict ratio={contrastRatio(colour(rule.token), colour(surface.token))} minimum={rule.minimum} compact />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="sys-contrast">
        {CONTRAST_PAIRS.map((pair) => (
          <li key={pair.id} className="sys-contrast__item">
            <span
              className="sys-contrast__sample"
              style={{ color: `var(${pair.foreground}, currentColor)`, background: `var(${pair.background}, transparent)` }}
              aria-hidden="true"
            >
              {pair.minimum === 3 ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              ) : (
                'Aa'
              )}
            </span>
            <span className="sys-contrast__meta">
              <span>{pair.label}</span>
              <span className="sys-note">
                <code>{pair.foreground}</code> on <code>{pair.background}</code>
              </span>
            </span>
            <span className="sys-contrast__result">
              <Verdict ratio={contrastRatio(colour(pair.foreground), colour(pair.background))} minimum={pair.minimum} />
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function TypeSection({ values }: { values: Values }): JSX.Element {
  return (
    <Section id="type" title="Type" lead="The scale as named steps, drawn at their real size.">
      <div>
        {TYPE_STEPS.map((step) => (
          <div key={step.token} className="sys-type">
            <div className="sys-type__meta">
              <strong>{step.name}</strong>
              <code>{step.token}</code>
              <code>{values[step.token] || 'not defined'}</code>
              <span>{step.role}</span>
            </div>
            <p className="sys-type__sample" style={{ fontSize: `var(${step.token}, 1rem)` }}>
              {step.sample}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Components: every one, in every state
// ---------------------------------------------------------------------------------------------------------------

function ComponentsSection({ latency, autorun }: DemoProps): JSX.Element {
  return (
    <Section
      id="components"
      title="Components"
      lead="Each component at rest in each of its states, drawn by the real component. Hover, focus and pressed are pinned so they can be seen and photographed; the live controls run for real at the selected latency."
    >
      {COMPONENT_GROUPS.map((group) => (
        <div key={group} className="sys-stack" data-group={group.toLowerCase()}>
          <h3 className="sys-subhead" id={`components-${group.toLowerCase()}`}>
            {group}
          </h3>
          <div className="sys-grid">
            {COMPONENTS.filter((entry) => (entry.group ?? 'Feedback') === group).map((entry) => {
              const Demo = COMPONENT_DEMOS[entry.id]
              return (
                <Card key={entry.id} wide={WIDE.has(entry.id)} title={entry.title} note={entry.summary}>
                  <StateList entry={entry} />
                  {Demo ? <Demo latency={latency} autorun={autorun} /> : <Missing kind="component" id={entry.id} />}
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </Section>
  )
}

const COMPONENT_GROUPS = ['Core', 'Forms', 'Overlays', 'Navigation', 'Feedback', 'Data', 'Charts'] as const
const WIDE = new Set([
  'action-button',
  'date-input',
  'combobox',
  'sheet',
  'command-menu',
  'code-input',
  'textarea',
  'button',
  'icon-button',
  'field',
  'text-input',
  'select',
  'menu',
  'dialog',
  'app-shell',
  'sidebar',
  'tab-bar',
  'banner',
  'error-page',
  'table',
  'balance-card',
  'allowance-card',
  'request-card',
  'kpi',
  'dashboard-grid',
  'filter-bar',
  'card',
  'line-chart',
  'amount',
])

function StateList({ entry }: { entry: ComponentEntry }): JSX.Element {
  return (
    <p className="sys-note">
      <span className="sys-note__label">States:</span> {entry.states.join(', ')}. <span className="sys-note__label">Rules:</span>{' '}
      {entry.standard}.
    </p>
  )
}

const ACTION_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const
const ACTION_STATES: readonly ActionPreview[] = ['idle', 'hover', 'focus', 'pressed', 'pending', 'slow', 'success', 'error', 'disabled']

function ActionButtonDemo({ latency }: DemoProps): JSX.Element {
  return (
    <div className="sys-matrix">
      {ACTION_VARIANTS.map((variant) => (
        <div key={variant} className="sys-matrix__row">
          <h4>{variant}</h4>
          <div className="sys-cells">
            {ACTION_STATES.map((state) => (
              <figure key={state} className="sys-cell">
                <ActionButton
                  variant={variant}
                  preview={state}
                  onAction={noop}
                  pendingLabel="Saving…"
                  successLabel="Saved"
                  slowLabel="Still saving…"
                  disabledReason="Nothing to save yet"
                >
                  Save
                </ActionButton>
                <figcaption>{state}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
      <div className="sys-matrix__row">
        <h4>live, runs at the selected latency</h4>
        <div className="sys-cells">
          <ActionButton
            variant="primary"
            pendingLabel="Saving…"
            successLabel="Saved"
            errorMessage={() => 'The change did not save. Your edits are still here. Try again.'}
            onAction={(signal) => simulate(latency, true, signal)}
          >
            Save
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

function SpinnerDemo(): JSX.Element {
  return (
    <div className="sys-row-wrap">
      <Spinner size="sm" label="Loading, small" />
      <Spinner size="md" label="Loading, medium" />
      <Spinner size="lg" label="Loading, large" />
    </div>
  )
}

function SkeletonDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <div className="sys-pair">
        <ul className="sys-list">
          <ProjectRow project={PROJECTS[0]} />
        </ul>
        <ul className="sys-list">
          <ProjectRowSkeleton />
        </ul>
      </div>
      <Skeleton variant="heading" />
      <Skeleton lines={3} />
      <div className="sys-row-wrap">
        <Skeleton variant="circle" />
        <Skeleton variant="rect" width="8rem" height={40} />
      </div>
    </div>
  )
}

function ProgressBarDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <ProgressBar label="Adding activity to the statement" />
      <ProgressBar label="Adding 0 of 12 months" value={0} announceEvery={false} />
      <ProgressBar label="Adding 5 of 12 months" value={42} detail="about 20 s left" announceEvery={false} onCancel={noop} />
      <ProgressBar label="Added 12 of 12 months" value={100} detail="done" announceEvery={false} />
    </div>
  )
}

function RegionDemo(): JSX.Element {
  // Titles only: dimmed muted text falls under 4.5:1, so what must stay readable while refreshing is ink.
  const rows = (
    <ul className="sys-list">
      {PROJECTS.slice(0, 2).map((project) => (
        <ProjectRow key={project.id} project={project} showMeta={false} />
      ))}
    </ul>
  )
  const skeleton = (
    <ul className="sys-list">
      <ProjectRowSkeleton />
      <ProjectRowSkeleton />
    </ul>
  )
  return (
    <div className="sys-pair">
      <figure className="sys-cell">
        <Region label="budgets" busy={false} hasContent={false} preview="first-load" fallback={skeleton} minHeight="9rem">
          {rows}
        </Region>
        <figcaption>first load: the skeleton, in reserved space</figcaption>
      </figure>
      <figure className="sys-cell">
        <Region label="budgets" busy={false} hasContent preview="refreshing" minHeight="9rem">
          {rows}
        </Region>
        <figcaption>refreshing: the list stays, dimmed, with a bar</figcaption>
      </figure>
      <figure className="sys-cell">
        <Region label="budgets" busy={false} hasContent minHeight="9rem">
          {rows}
        </Region>
        <figcaption>loaded</figcaption>
      </figure>
    </div>
  )
}

function InlineMessageDemo(): JSX.Element {
  const [dismissed, setDismissed] = useState(false)
  return (
    <div className="sys-stack">
      <InlineMessage tone="info" title="Your statement is being made">
        You can leave this page. You’ll get a notification when it’s ready.
      </InlineMessage>
      <InlineMessage tone="success" title="Saved">
        Ivy’s allowance now arrives on Fridays.
      </InlineMessage>
      <InlineMessage
        tone="warning"
        title="Food is nearly at its limit"
        action={
          <button type="button" className="sys-btn">
            View budget
          </button>
        }
      >
        £312.40 of £400.00, with 9 days to go.
      </InlineMessage>
      <InlineMessage tone="error" title="Could not save the food budget">
        Your changes are still here. Try again.
      </InlineMessage>
      {dismissed ? (
        <button type="button" className="sys-btn" onClick={() => setDismissed(false)}>
          Show the dismissible message again
        </button>
      ) : (
        <InlineMessage tone="info" onDismiss={() => setDismissed(true)}>
          Scheduled maintenance on Sun 1 Nov, 02:00 to 03:00. (sample)
        </InlineMessage>
      )}
    </div>
  )
}

const TOAST_TONES: readonly ToastTone[] = ['neutral', 'info', 'success', 'warning', 'error']
/** One sample per tone, in Kitty's words (CONTENT.md, Toasts) */
const TOAST_SAMPLES: Readonly<Record<ToastTone, string>> = {
  neutral: 'Moved to Groceries.',
  info: 'Sam joined the kitty.',
  success: 'Sent £20.00 to Sam.',
  warning: 'Food is £12.40 over its budget.',
  error: 'Could not send £20.00. Nothing left the kitty.',
}

function ToastDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      {TOAST_TONES.map((tone) => (
        <ToastCard key={tone} tone={tone} message={TOAST_SAMPLES[tone]} />
      ))}
      <ToastCard tone="neutral" message="Ivy’s allowance paused." action={{ label: 'Undo', onClick: noop }} />
    </div>
  )
}

function AnnouncementLog(): JSX.Element {
  const spoken = useAnnouncements()
  return spoken.log.length ? (
    <ol className="sys-log" aria-label="Recent announcements">
      {spoken.log.map((entry) => (
        <li key={entry.id}>
          <span className="sys-badge">{entry.politeness}</span>
          <span>{entry.text}</span>
        </li>
      ))}
    </ol>
  ) : (
    <p className="sys-note">Nothing announced yet. Use any control on this page.</p>
  )
}

function LiveRegionDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      <div className="sys-controls">
        <button type="button" className="sys-btn" onClick={() => announce('Three results returned')}>
          Announce politely
        </button>
        <button type="button" className="sys-btn" onClick={() => announce('Could not reach the server. Try again.', 'assertive')}>
          Announce an error
        </button>
      </div>
      <AnnouncementLog />
    </div>
  )
}

const COMPONENT_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  ...KITTY_DEMOS,
  'action-button': ActionButtonDemo,
  spinner: SpinnerDemo,
  skeleton: SkeletonDemo,
  'progress-bar': ProgressBarDemo,
  region: RegionDemo,
  'inline-message': InlineMessageDemo,
  toast: ToastDemo,
  'live-region': LiveRegionDemo,
}

// ---------------------------------------------------------------------------------------------------------------
// Sequences: the real interactions, driven by the latency control
// ---------------------------------------------------------------------------------------------------------------

interface Project {
  readonly id: string
  readonly title: string
  readonly meta: string
  readonly status: 'active' | 'archived'
}

const PROJECTS: readonly Project[] = [
  { id: 'p1', title: 'Groceries', meta: 'Updated 2 days ago · £312.40 of £400.00', status: 'active' },
  { id: 'p2', title: 'Fun', meta: 'Updated 5 days ago · £96.20 of £150.00', status: 'active' },
  { id: 'p3', title: 'Summer holiday', meta: 'Ended in August · £1,200.00', status: 'archived' },
  { id: 'p4', title: 'Home', meta: 'Updated 3 weeks ago · £114.80 of £100.00', status: 'active' },
  { id: 'p5', title: 'Christmas presents', meta: 'Ended last year · £640.00', status: 'archived' },
  { id: 'p6', title: 'Transport', meta: 'Updated last month · No limit', status: 'active' },
]

function ProjectRow({ project, showMeta = true }: { project: Project; showMeta?: boolean }): JSX.Element {
  return (
    <li className="sys-project">
      <span className="sys-project__avatar" aria-hidden="true">
        {project.title.charAt(0)}
      </span>
      <span className="sys-project__text">
        <span className="sys-project__title">{project.title}</span>
        {showMeta ? <span className="sys-project__meta">{project.meta}</span> : null}
      </span>
      <span className="sys-badge">{project.status}</span>
    </li>
  )
}

/** Built from the same grid and line heights as ProjectRow, so the swap changes nothing. */
function ProjectRowSkeleton(): JSX.Element {
  return (
    <li className="sys-project" aria-hidden="true">
      <Skeleton variant="circle" />
      <span className="sys-project__text">
        <span className="sys-project__title">
          <Skeleton lines={1} />
        </span>
        <span className="sys-project__meta">
          <Skeleton lines={1} />
        </span>
      </span>
      <span />
    </li>
  )
}

function SequencesSection({ latency, autorun }: DemoProps): JSX.Element {
  return (
    <Section
      id="sequences"
      title="Sequences"
      lead="The real interactions, end to end. Change the latency in the toolbar and run them again. Open the page with ?latency=fail (or fast, slow, very-slow, stalled) to see each one run once as it scrolls into view."
    >
      <Card wide title="What a screen reader hears" note="Every announcement the live regions make, newest first, so a reviewer can check the words without a screen reader.">
        <AnnouncementLog />
      </Card>
      <div className="sys-grid" data-autorun-scope>
        {SEQUENCES.map((entry) => (
          <SequenceCard key={entry.id} entry={entry} latency={latency} autorun={autorun} />
        ))}
      </div>
    </Section>
  )
}

function SequenceCard({ entry, latency, autorun }: DemoProps & { entry: SequenceEntry }): JSX.Element {
  const Demo = SEQUENCE_DEMOS[entry.id]
  return (
    <Card wide={entry.id === 'list' || entry.id === 'toast'} title={entry.title} note={entry.summary} data-sequence={entry.id}>
      {Demo ? <Demo latency={latency} autorun={autorun} /> : <Missing kind="sequence" id={entry.id} />}
      <p className="sys-watch">
        <span className="sys-note__label">Watch for:</span> {entry.watch}
      </p>
    </Card>
  )
}

function SubmitSequence({ latency, autorun }: DemoProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [name, setName] = useState('Groceries')
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fieldId = useId()
  const messageId = useId()
  const describe = (failure: unknown): string =>
    failure instanceof SimulatedFailure
      ? 'Could not save the budget name. Your changes are still here. Try again.'
      : 'This took too long and was stopped. Your changes are still here. Try again.'
  useAutorun(cardRef, autorun, () => buttonRef.current?.click())
  return (
    <div ref={cardRef} className="sys-stack">
      <div className="sys-field">
        <label htmlFor={fieldId}>Budget name</label>
        <input id={fieldId} value={name} onChange={(event) => setName(event.target.value)} aria-describedby={error ? messageId : undefined} />
      </div>
      <div className="sys-row-wrap">
        <ActionButton
          ref={buttonRef}
          variant="primary"
          pendingLabel="Saving…"
          successLabel="Saved"
          slowLabel="Still saving…"
          errorMessage={describe}
          aria-describedby={error ? messageId : undefined}
          onAction={async (signal) => {
            setError(null)
            await simulate(latency, true, signal)
            setSaved(new Date().toLocaleTimeString())
          }}
          onError={(failure) => setError(describe(failure))}
        >
          Save changes
        </ActionButton>
        {saved ? <span className="sys-note">Last saved at {saved}</span> : null}
      </div>
      {error ? (
        <InlineMessage id={messageId} tone="error" title="Could not save">
          {error}
        </InlineMessage>
      ) : null}
    </div>
  )
}

const ZONES = 12

function JobSequence({ latency, autorun }: DemoProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'canceled' | 'failed'>('idle')
  const [done, setDone] = useState(0)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])
  useAutorun(cardRef, autorun, () => buttonRef.current?.click())

  const preset = presetFor(latency)
  // Long enough to show the thresholds: more than 10 s gets Cancel and the leave-the-page line.
  const expectedMs = Math.min(20000, Math.max(1200, preset.ms * 4))
  const long = expectedMs > 10000
  const leftMs = (expectedMs * (ZONES - done)) / ZONES
  const left = leftMs > 10000 ? Math.ceil((leftMs * 1.2) / 5000) * 5 : Math.ceil(leftMs / 1000)

  function run(): void {
    const own = new AbortController()
    abort.current = own
    setPhase('running')
    setDone(0)
    void (async () => {
      try {
        for (let zone = 1; zone <= ZONES; zone += 1) {
          await wait(expectedMs / ZONES, own.signal)
          if (preset.fails && zone === 7) throw new SimulatedFailure()
          setDone(zone)
        }
        setPhase('done')
      } catch (failure) {
        setPhase(isAbort(failure) ? 'canceled' : 'failed')
      }
    })()
  }

  return (
    <div ref={cardRef} className="sys-stack">
      <div className="sys-row-wrap">
        <ActionButton
          ref={buttonRef}
          variant="secondary"
          knownSlow
          pendingLabel="Starting…"
          successLabel="Started"
          successMessage={false}
          disabled={phase === 'running'}
          disabledReason="A statement is already being made"
          onAction={async (signal) => {
            await wait(120, signal) // the job is accepted at once; progress follows
            run()
          }}
        >
          Export {ZONES} months
        </ActionButton>
        <span className="sys-note">About {Math.round(expectedMs / 1000)} s at this latency.</span>
      </div>
      {phase !== 'idle' ? (
        <ProgressBar
          label={phase === 'done' ? `Added ${ZONES} of ${ZONES} months` : `Adding ${done} of ${ZONES} months`}
          value={(done / ZONES) * 100}
          detail={phase === 'running' && expectedMs >= 3000 ? `about ${left} s left` : undefined}
          completeMessage={`Statement ready: ${ZONES} months`}
          onCancel={phase === 'running' && long ? () => abort.current?.abort() : undefined}
        />
      ) : null}
      {phase === 'running' && long ? <p className="sys-note">You can leave this page. You’ll get a notification when the statement is ready.</p> : null}
      {phase === 'done' ? (
        <InlineMessage tone="success" title="Statement ready">
          All {ZONES} months are in the file. Download it from Settings → Statements.
        </InlineMessage>
      ) : null}
      {phase === 'canceled' ? (
        <InlineMessage tone="info" title="Export cancelled" announceText={`Export cancelled after ${done} of ${ZONES} months.`}>
          No file was made. Nothing else changed.
        </InlineMessage>
      ) : null}
      {phase === 'failed' ? (
        <InlineMessage tone="error" title="Export failed" announceText={`Export failed at month ${done + 1} of ${ZONES}.`}>
          No file was made. Try again.
        </InlineMessage>
      ) : null}
    </div>
  )
}

type Filter = 'all' | 'active' | 'archived' | 'overdue'
const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
  { id: 'overdue', label: 'Overdue' },
]
const select = (filter: Filter): readonly Project[] =>
  filter === 'all' ? PROJECTS : filter === 'overdue' ? [] : PROJECTS.filter((project) => project.status === filter)

function ListSequence({ latency, autorun }: DemoProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<readonly Project[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  const load = useCallback(
    (next: Filter): void => {
      abort.current?.abort() // a newer request replaces the one in flight
      const own = new AbortController()
      abort.current = own
      setFilter(next)
      setBusy(true)
      setFailed(false)
      simulate(latency, select(next), own.signal)
        .then((result) => setRows(result))
        .catch((failure: unknown) => {
          if (!isAbort(failure)) setFailed(true)
        })
        .finally(() => {
          if (abort.current === own) setBusy(false)
        })
    },
    [latency],
  )
  useAutorun(cardRef, autorun, () => load('all'))

  let content: ReactNode
  if (failed && rows === null) {
    content = (
      <ErrorState title="Could not load budgets" headingLevel={4} onRetry={() => load(filter)}>
        The connection dropped before the list arrived. Nothing was lost. Try again.
      </ErrorState>
    )
  } else if (rows === null) {
    content = (
      <EmptyState
        headingLevel={4}
        kind="first-use"
        title="No budgets loaded yet"
        action={
          <ActionButton variant="primary" onAction={() => load('all')}>
            Load budgets
          </ActionButton>
        }
      >
        Load the list to see the loading treatment: a skeleton the size of the rows on the first load.
      </EmptyState>
    )
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        headingLevel={4}
        kind="no-results"
        title="No budgets are overdue"
        filters={[`Status: ${filter}`]}
        action={
          <ActionButton variant="secondary" onAction={() => load('all')}>
            Clear filters
          </ActionButton>
        }
      >
        Nothing is {filter}. Try another filter.
      </EmptyState>
    )
  } else {
    content = (
      <div className="sys-stack">
        {failed ? (
          <InlineMessage
            tone="error"
            title="Could not refresh"
            announceText="Could not refresh the list. Showing the earlier results."
            action={
              <ActionButton variant="primary" onAction={() => load(filter)}>
                Try again
              </ActionButton>
            }
          >
            Showing the results from before. Nothing was lost.
          </InlineMessage>
        ) : null}
        <ul className="sys-list">
          {rows.map((project) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div ref={cardRef} className="sys-stack">
      <div className="sys-controls" role="group" aria-label="List controls">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" className="sys-btn" aria-pressed={rows !== null && item.id === filter} onClick={() => load(item.id)}>
            {item.label}
          </button>
        ))}
        <button type="button" className="sys-btn" onClick={() => load(filter)}>
          Reload
        </button>
        <button
          type="button"
          className="sys-btn"
          onClick={() => {
            abort.current?.abort()
            setBusy(false)
            setFailed(false)
            setRows(null)
          }}
        >
          Clear list
        </button>
      </div>
      <Region
        label="budgets"
        busy={busy}
        hasContent={rows !== null && rows.length > 0}
        minHeight="26rem"
        loadedMessage={rows ? `${rows.length} ${rows.length === 1 ? 'budget' : 'budgets'} loaded.` : undefined}
        fallback={
          <ul className="sys-list">
            {PROJECTS.map((project) => (
              <ProjectRowSkeleton key={project.id} />
            ))}
          </ul>
        }
      >
        {content}
      </Region>
    </div>
  )
}

interface Draft {
  readonly id: string
  readonly title: string
}
const DRAFTS: readonly Draft[] = [
  { id: 'd1', title: 'Ivy’s allowance' },
  { id: 'd2', title: 'Theo’s allowance' },
  { id: 'd3', title: 'Weekly groceries transfer' },
]

function ToastSequence({ latency, autorun }: DemoProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [removed, setRemoved] = useState<readonly string[]>([])
  const live = useToasts()
  useAutorun(cardRef, autorun, () => buttonRef.current?.click())
  const remove = (draft: Draft): void => {
    setRemoved((current) => [...current, draft.id])
    toast(`${draft.title} removed.`, {
      id: draft.id,
      action: { label: 'Undo', onClick: () => setRemoved((current) => current.filter((id) => id !== draft.id)) },
      duration: 10000, // the Undo window: at least 10 s
    })
  }
  const visible = DRAFTS.filter((draft) => !removed.includes(draft.id))
  const gone = DRAFTS.filter((draft) => removed.includes(draft.id))
  const raise = (tone: ToastTone, message: string): void => void toast(message, { tone })
  return (
    <div ref={cardRef} className="sys-pair" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))' }}>
    <div className="sys-stack">
      <ul className="sys-list">
        {visible.map((draft) => (
          <li key={draft.id} className="sys-project" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}>
            <span className="sys-project__title">{draft.title}</span>
            <button type="button" className="sys-btn" onClick={() => remove(draft)}>
              Remove<span className="fb-sr"> {draft.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? <p className="sys-note">All removed. Undo the toast, or restore them below.</p> : null}
      {gone.length ? (
        <div className="sys-readout">
          Recently removed: {gone.map((draft) => draft.title).join(', ')}.{' '}
          <button type="button" className="sys-btn" onClick={() => setRemoved([])}>
            Restore all
          </button>
        </div>
      ) : null}
      <div className="sys-controls" role="group" aria-label="Raise a toast">
        <button type="button" className="sys-btn" onClick={() => raise('neutral', 'Invite link copied.')}>
          Neutral
        </button>
        <button type="button" className="sys-btn" onClick={() => raise('success', 'Export finished. It is in your exports list.')}>
          Success
        </button>
        <button type="button" className="sys-btn" onClick={() => raise('warning', 'Your session ends in 5 minutes.')}>
          Warning
        </button>
        <button type="button" className="sys-btn" onClick={() => raise('error', 'The import stopped at row 40. Open the report to retry.')}>
          Error (stays)
        </button>
        <button
          type="button"
          className="sys-btn"
          onClick={() => {
            for (let n = 1; n <= 5; n += 1) toast(`Queued message ${n}.`, { tone: 'info' })
          }}
        >
          Five at once
        </button>
      </div>
      <ActionButton
        ref={buttonRef}
        variant="secondary"
        knownSlow
        pendingLabel="Starting…"
        successLabel="Started"
        successMessage={false}
        onAction={async (signal) => {
          await wait(120, signal) // the job is accepted at once; the result comes later
          simulate(latency, true)
            .then(() =>
              toast('Export finished. The file is in your exports list.', {
                tone: 'success',
                action: { label: 'Open', onClick: noop },
              }),
            )
            .catch(() => toast('The export failed. Open the exports list to try again.', { tone: 'error' }))
        }}
      >
        Export in the background
      </ActionButton>
      <p className="sys-note">
        The toast after the export is the background-result case: it can arrive while the person is elsewhere, and the
        same result is in the exports list. It carries an action or an error, so it stays until dismissed.
      </p>
    </div>
    {/* A drawn copy of the live stack, so a still capture shows the toasts and their Undo; the real region (fixed to
        the screen edge) is the one people use and hear. inert: not focusable, not announced. */}
    <figure className="sys-cell" inert>
      {live.length ? (
        live.slice(-3).map((item) => <ToastCard key={item.id} tone={item.tone} message={item.message} action={item.action ? { label: item.action.label, onClick: noop } : undefined} />)
      ) : (
        <p className="sys-note">No toasts on screen.</p>
      )}
      <figcaption>On screen now: a copy of the toast stack</figcaption>
    </figure>
    </div>
  )
}

const OUTCOMES: readonly { id: Outcome; label: string }[] = [
  { id: 'results', label: 'Results' },
  { id: 'empty', label: 'Empty' },
]
const NETWORKS: readonly { id: Network; label: string }[] = [
  { id: 'online', label: 'Online' },
  { id: 'offline', label: 'Offline' },
]

/** Real product flows built from the system (scenarios/Scenarios.tsx), with outcome and network controls. */
function ScenariosSection({ latency, autorun, onLatency }: { latency: LatencyId; autorun: boolean; onLatency: (next: LatencyId) => void }): JSX.Element {
  // `?outcome=empty` and `?network=offline` set the controls, so a capture can show those states without a click.
  const [params] = useSearchParams()
  const [outcome, setOutcome] = useState<Outcome>(() => (params.get('outcome') === 'empty' ? 'empty' : 'results'))
  const [network, setNetwork] = useState<Network>(() => (params.get('network') === 'offline' ? 'offline' : 'online'))
  // `?run=1`: the action scenarios press their own buttons once the section scrolls into view, so a capture's
  // `--times` (counted from that moment) land on pending, success or error.
  const wantRun = params.get('run') === '1'
  const [run, setRun] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = gridRef.current
    if (!wantRun || !element) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      setRun(true)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [wantRun])
  return (
    <Section
      id="scenarios"
      title="Scenarios"
      lead="Whole flows as the product will have them: what shows while the person waits, how the result arrives, and what happens when it fails, comes back empty or the network drops. Combine the toolbar latency with the outcome and network here."
    >
      <div className="sys-toolbar" role="toolbar" aria-label="Scenario settings">
        <Choice label="Latency" options={LATENCY_PRESETS.map((item) => ({ id: item.id, label: item.label }))} value={latency} onChange={onLatency} />
        <Choice label="Outcome" options={OUTCOMES} value={outcome} onChange={setOutcome} />
        <Choice label="Network" options={NETWORKS} value={network} onChange={setNetwork} />
      </div>
      <div className="sys-grid" ref={gridRef}>
        {SCENARIOS.map((entry) => {
          const Demo = SCENARIO_DEMOS[entry.id]
          return (
            <Card key={entry.id} title={entry.title} note={entry.summary} data-sequence={`scenario-${entry.id}`}>
              {Demo ? <Demo latency={latency} outcome={outcome} network={network} autorun={autorun} run={wantRun ? run : undefined} /> : <Missing kind="scenario" id={entry.id} />}
              <p className="sys-watch">
                <span className="sys-note__label">Watch for:</span> {entry.watch}
              </p>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}

const SEQUENCE_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  submit: SubmitSequence,
  job: JobSequence,
  list: ListSequence,
  toast: ToastSequence,
}

// ---------------------------------------------------------------------------------------------------------------
// Patterns: empty states and error pages
// ---------------------------------------------------------------------------------------------------------------

function PatternsSection({ latency, autorun }: DemoProps): JSX.Element {
  return (
    <Section
      id="patterns"
      title="Patterns"
      lead="Every list, table, feed and chart in the inventory has its empty variants, and every region its failed-load state. Each fills the space the content would have filled."
    >
      <div className="sys-stack">
        {PATTERNS.map((entry) => (
          <PatternCard key={entry.id} entry={entry} latency={latency} autorun={autorun} />
        ))}
      </div>
    </Section>
  )
}

function PatternCard({ entry, latency, autorun }: DemoProps & { entry: PatternEntry }): JSX.Element {
  const Demo = PATTERN_DEMOS[entry.id]
  return (
    <Card wide title={entry.title} note={entry.summary}>
      {Demo ? <Demo latency={latency} autorun={autorun} /> : <Missing kind="pattern" id={entry.id} />}
    </Card>
  )
}

function EmptyStatesPattern(): JSX.Element {
  // CONTENT.md, Empty states: Kitty has no plans, so "locked" is the kid view of a parent-only area.
  return (
    <div className="sys-grid">
      <EmptyState
        headingLevel={4}
        kind="first-use"
        title="Your kitty is empty"
        action={
          <ActionButton variant="primary" onAction={noop}>
            Add money
          </ActionButton>
        }
      >
        Add money, then invite family to share it.
      </EmptyState>
      <EmptyState
        headingLevel={4}
        kind="no-results"
        title="No transactions match “tesco”"
        filters={['Person: Sam', 'Category: Groceries']}
        onRemoveFilter={() => {}}
        action={
          <ActionButton variant="secondary" onAction={noop}>
            Clear filters
          </ActionButton>
        }
      >
        Check the spelling, or clear a filter.
      </EmptyState>
      <EmptyState headingLevel={4} kind="cleared" title="All caught up">
        New requests show here as they come in.
      </EmptyState>
      <EmptyState headingLevel={4} kind="locked" title="Budgets are for parents">
        Ask Ada or Sam if you want to change one.
      </EmptyState>
    </div>
  )
}

function ErrorPagesPattern({ latency }: DemoProps): JSX.Element {
  return (
    <div className="sys-grid">
      <ErrorState title="Could not load activity" announceOnMount={false} headingLevel={4} onRetry={(signal) => simulate(latency, true, signal)}>
        Your filters are kept. Check your connection, then try again.
      </ErrorState>
      <ErrorState title="This page is not in the book" announceOnMount={false} headingLevel={4} secondary={<Link to="/system">Go to Home</Link>}>
        Check the address, or go to Home.
      </ErrorState>
      <ErrorState
        title="Something on our side stopped working"
        announceOnMount={false}
        headingLevel={4}
        onRetry={(signal) => simulate(latency, true, signal)}
        secondary={<a href="#help">Get help</a>}
      >
        Your money is safe. Try again in a few minutes.
      </ErrorState>
      <ErrorState title="Kitty is down for a moment" announceOnMount={false} headingLevel={4} secondary={<a href="#help">Get help</a>}>
        Your money is safe. We are working on it.
      </ErrorState>
    </div>
  )
}

const PATTERN_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  'empty-states': EmptyStatesPattern,
  'error-pages': ErrorPagesPattern,
}
