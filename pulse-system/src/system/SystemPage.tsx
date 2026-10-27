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
  EFFECTS,
  PATTERNS,
  SECTIONS,
  SEQUENCES,
  TOKEN_GROUPS,
  TYPE_STEPS,
  type ComponentEntry,
  type EffectEntry,
  type PatternEntry,
  type SequenceEntry,
  type TokenGroup,
  type TokenName,
  type TokenSpec,
} from './registry'
import { Heard, SCENARIOS, SCENARIO_DEMOS, type Network, type Outcome } from './scenarios/Scenarios'
import { pulsePlay, typeOn } from './vfx'
import { INSTRUMENT_DEMOS } from './instrument/demos'
import { BANK_FILTERS, FACTORY_PATCHES, PatchList, PatchListSkeleton, type BankFilter, type PatchRow } from './instrument'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/doto'
import './SystemPage.css'

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
type MotionChoice = 'system' | 'reduced'
type DensityChoice = 'comfortable' | 'compact'
type FrameChoice = 'full' | '320' | '768' | '1280'

const THEMES: readonly { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
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
    const element = ref.current
    if (!enabled || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        latest.current()
      },
      { threshold: 0.3 },
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
  const [motion, setMotion] = useState<MotionChoice>(() => readChoice('data-motion', ['reduced'], 'system'))
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

  // ?motion=reduced starts the page in reduced motion, so a capture can show the stills without a click.
  useEffect(() => {
    if (params.get('motion') === 'reduced') chooseMotion('reduced')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Leave <html> as it was found when the person goes elsewhere.
  useEffect(() => {
    const root = document.documentElement
    const before = [root.getAttribute('data-theme'), root.getAttribute('data-motion')] as const
    return () => {
      setRootAttribute('data-theme', before[0])
      setRootAttribute('data-motion', before[1])
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
      <title>System</title>
      <meta name="robots" content="noindex" />
      {own.live ? <LiveRegion /> : null}
      {own.toasts ? <ToastRegion /> : null}
      <header className="sys-header" ref={headerRef}>
        <div className="sys-header__inner">
          <div className="sys-title">
            <h1>System</h1>
            <p>{scope ? `The design system of page “${scope}”` : 'The project design system'}, running on its own code.</p>
          </div>
          {/* Folded behind a disclosure at every width, so the page title and the first section lead. */}
          <details className="sys-settings">
            <summary className="sys-settings__summary">
              Page settings
              <span className="sys-settings__now">
                {THEMES.find((t) => t.id === theme)?.label} · {presetFor(latency).label} latency
                {motion === 'reduced' ? ' · reduced motion' : ''}
              </span>
            </summary>
          <div className="sys-toolbar" role="toolbar" aria-label="Page settings">
            <Choice label="Theme" options={THEMES} value={theme} onChange={chooseTheme} />
            <Choice label="Reduced motion" options={MOTIONS} value={motion} onChange={chooseMotion} />
            <Choice label="Density" options={DENSITIES} value={density} onChange={setDensity} />
            <Choice label="Width" options={FRAMES} value={frame} onChange={setFrame} />
            <Choice
              label="Latency"
              options={LATENCY_PRESETS.map((item) => ({ id: item.id, label: item.label }))}
              value={latency}
              onChange={chooseLatency}
              hint={presetFor(latency).hint}
            />
          </div>
          </details>
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
            <EffectsSection autorun={autorun} />
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
              data-shape={pair.minimum === 3 ? 'fill' : undefined}
            >
              {/* a 3:1 pair is a fill, an icon or a trace, never text: draw it as a bar so it is judged as one */}
              {pair.minimum === 3 ? <span className="sys-contrast__bar" style={{ background: `var(${pair.foreground})` }} /> : 'Aa'}
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
      <div className="sys-grid">
        {COMPONENTS.map((entry) => {
          const Demo = COMPONENT_DEMOS[entry.id]
          return (
            <Card key={entry.id} wide={entry.id === 'action-button'} title={entry.title} note={entry.summary}>
              <StateList entry={entry} />
              {Demo ? <Demo latency={latency} autorun={autorun} /> : <Missing kind="component" id={entry.id} />}
            </Card>
          )
        })}
      </div>
    </Section>
  )
}

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
          <BankRow row={BANK[0]} />
        </ul>
        <ul className="sys-list">
          <BankRowSkeleton />
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
      <ProgressBar label="Writing the bank" />
      <ProgressBar label="Writing 0 of 12 slots" value={0} announceEvery={false} />
      <ProgressBar label="Writing 5 of 12 slots" value={42} detail="about 20 s left" announceEvery={false} onCancel={noop} />
      <ProgressBar label="Wrote 12 of 12 slots" value={100} detail="done" announceEvery={false} />
    </div>
  )
}

function RegionDemo(): JSX.Element {
  // Titles only: dimmed muted text falls under 4.5:1, so what must stay readable while refreshing is ink.
  const rows = (
    <ul className="sys-list">
      {BANK.slice(0, 2).map((row) => (
        <BankRow key={row.id} row={row} />
      ))}
    </ul>
  )
  const skeleton = (
    <ul className="sys-list">
      <BankRowSkeleton />
      <BankRowSkeleton />
    </ul>
  )
  return (
    <div className="sys-pair">
      <figure className="sys-cell">
        <Region label="patch bank" busy={false} hasContent={false} preview="first-load" fallback={skeleton} minHeight="9rem">
          {rows}
        </Region>
        <figcaption>first load: the skeleton, in reserved space</figcaption>
      </figure>
      <figure className="sys-cell">
        <Region label="patch bank" busy={false} hasContent preview="refreshing" minHeight="9rem">
          {rows}
        </Region>
        <figcaption>refreshing: the bank stays at full ink, under the busy bar</figcaption>
      </figure>
      <figure className="sys-cell">
        <Region label="patch bank" busy={false} hasContent minHeight="9rem">
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
      <InlineMessage tone="info" title="Matching runs in the background">
        You can leave this page. We will email you when it is done.
      </InlineMessage>
      <InlineMessage tone="success" title="Patch saved">
        Night Bass is on slot 1.
      </InlineMessage>
      <InlineMessage
        tone="warning"
        title="Two patches share slot 7"
        action={
          <button type="button" className="sys-btn">
            Review slots
          </button>
        }
      >
        The newer one plays until you move the other.
      </InlineMessage>
      <InlineMessage tone="error" title="Could not save">
        The connection dropped. Your changes are still here. Try again.
      </InlineMessage>
      {dismissed ? (
        <button type="button" className="sys-btn" onClick={() => setDismissed(false)}>
          Show the dismissible message again
        </button>
      ) : (
        <InlineMessage tone="info" onDismiss={() => setDismissed(true)}>
          A message with a close button.
        </InlineMessage>
      )}
    </div>
  )
}

const TOAST_TONES: readonly ToastTone[] = ['neutral', 'info', 'success', 'warning', 'error']

function ToastDemo(): JSX.Element {
  return (
    <div className="sys-stack">
      {TOAST_TONES.map((tone) => (
        <ToastCard key={tone} tone={tone} message={`A ${tone} toast, one short sentence.`} />
      ))}
      <ToastCard tone="neutral" message="Patch deleted." action={{ label: 'Undo', onClick: noop }} />
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
  'action-button': ActionButtonDemo,
  spinner: SpinnerDemo,
  skeleton: SkeletonDemo,
  'progress-bar': ProgressBarDemo,
  region: RegionDemo,
  'inline-message': InlineMessageDemo,
  toast: ToastDemo,
  'live-region': LiveRegionDemo,
  ...INSTRUMENT_DEMOS,
}

// ---------------------------------------------------------------------------------------------------------------
// Sequences: the real interactions, driven by the latency control
// ---------------------------------------------------------------------------------------------------------------

/** The list sequence runs on the real patch bank: the six factory patches, as the landing page lists them. */
const BANK: readonly PatchRow[] = FACTORY_PATCHES.map(({ id, number, name, type }) => ({ id, number, name, type }))

/** One bank row for the skeleton and region demos: the slot number in the readout face, the name, the type legend. */
function BankRow({ row }: { row: PatchRow }): JSX.Element {
  return (
    <li className="sys-project">
      <span className="sys-project__slot" aria-hidden="true">
        {String(row.number).padStart(3, '0')}
      </span>
      <span className="sys-project__text">
        <span className="sys-project__title">{row.name}</span>
      </span>
      <span className="pi-legend">{row.type}</span>
    </li>
  )
}

/** Built from the same grid and line heights as BankRow, so the swap changes nothing. */
function BankRowSkeleton(): JSX.Element {
  return (
    <li className="sys-project" aria-hidden="true">
      <Skeleton variant="rect" width="2.5rem" height={20} />
      <span className="sys-project__text">
        <span className="sys-project__title">
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
      <div className="sys-grid">
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
    <Card wide={entry.id === 'list'} title={entry.title} note={entry.summary} data-sequence={entry.id}>
      {Demo ? <Demo latency={latency} autorun={autorun} /> : <Missing kind="sequence" id={entry.id} />}
      <div className="sys-card__foot">
        <p className="sys-meta">
          <span className="sys-note__lead">What to look for:</span> {entry.watch}
        </p>
      </div>
    </Card>
  )
}

function SubmitSequence({ latency, autorun }: DemoProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [name, setName] = useState('Night Bass')
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fieldId = useId()
  const messageId = useId()
  const describe = (failure: unknown): string =>
    failure instanceof SimulatedFailure
      ? 'The patch name didn’t save. Your changes are still here. Try again.'
      : 'This took too long and was stopped. Your changes are still here. Try again.'
  useAutorun(cardRef, autorun, () => buttonRef.current?.click())
  return (
    <div ref={cardRef} className="sys-stack">
      <div className="sys-field">
        <label htmlFor={fieldId}>Patch name</label>
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
          disabledReason="Matching is already running"
          onAction={async (signal) => {
            await wait(120, signal) // the job is accepted at once; progress follows
            run()
          }}
        >
          Write the bank ({ZONES} slots)
        </ActionButton>
        <span className="sys-note">About {Math.round(expectedMs / 1000)} s at this latency.</span>
      </div>
      {/* the bar's space is kept before the job starts, so starting it moves nothing */}
      <div className="sys-slot">
        <div data-on={phase !== 'idle' || undefined} aria-hidden={phase === 'idle'} inert={phase === 'idle'}>
          <ProgressBar
            label={phase === 'done' ? `Wrote ${ZONES} of ${ZONES} slots` : `Writing ${done} of ${ZONES} slots`}
            value={(done / ZONES) * 100}
            detail={phase === 'running' && expectedMs >= 3000 ? `about ${left} s left` : undefined}
            completeMessage={`All ${ZONES} slots written`}
            onCancel={phase === 'running' && long ? () => abort.current?.abort() : undefined}
          />
        </div>
      </div>
      {phase === 'running' && long ? <p className="sys-note">You can leave this page. We will email you when matching is done.</p> : null}
      {phase === 'done' ? (
        <InlineMessage tone="success" title="Bank written">
          All {ZONES} slots now hold their patches.
        </InlineMessage>
      ) : null}
      {phase === 'canceled' ? (
        <InlineMessage tone="info" title="Writing canceled" announceText={`Writing canceled after ${done} of ${ZONES} slots.`}>
          {done} of {ZONES} slots were written. Nothing else changed.
        </InlineMessage>
      ) : null}
      {phase === 'failed' ? (
        <InlineMessage tone="error" title="Writing stopped" announceText={`Writing stopped at slot ${done + 1} of ${ZONES}.`}>
          The first {done} slots are saved. Start again to continue.
        </InlineMessage>
      ) : null}
    </div>
  )
}

const select = (filter: BankFilter): readonly PatchRow[] =>
  filter === 'all' ? BANK : filter === 'mine' ? BANK.filter((row) => row.mine) : BANK.filter((row) => row.type === filter)

function ListSequence({ latency, autorun }: DemoProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<readonly PatchRow[] | null>(null)
  const [filter, setFilter] = useState<BankFilter>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])

  const load = useCallback(
    (next: BankFilter): void => {
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

  let status: ReactNode = null
  if (failed && rows === null) {
    status = (
      <ErrorState title="The bank didn't load" headingLevel={4} onRetry={() => load(filter)}>
        The connection dropped before the patches arrived. Nothing was lost. Try again.
      </ErrorState>
    )
  } else if (rows === null) {
    status = (
      <EmptyState
        headingLevel={4}
        kind="first-use"
        title="The bank is empty"
        action={
          <ActionButton variant="primary" onAction={() => load('all')}>
            Load the factory six
          </ActionButton>
        }
      >
        Load the bank to see its loading treatment: vent-slot rows the size of the patches, on the first load.
      </EmptyState>
    )
  } else if (rows.length === 0) {
    status = (
      <EmptyState
        headingLevel={4}
        kind="no-results"
        title={filter === 'mine' ? 'No patches of yours yet' : 'No patches of that type'}
        filters={[`Bank: ${BANK_FILTERS.find((item) => item.id === filter)?.label ?? filter}`]}
        action={
          <ActionButton variant="secondary" onAction={() => load('all')}>
            Show all patches
          </ActionButton>
        }
      >
        {filter === 'mine' ? 'Turn a knob on the instrument and save the sound: it lands here.' : 'Try another type, or show all six.'}
      </EmptyState>
    )
  }

  return (
    <div ref={cardRef} className="sys-stack">
      <div className="sys-controls" role="group" aria-label="Bank controls">
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
          Clear the bank
        </button>
      </div>
      {failed && rows !== null ? (
        <InlineMessage
          tone="error"
          title="Couldn't refresh the bank"
          announceText="Couldn't refresh the bank. Showing the patches from before."
          action={
            <ActionButton variant="primary" onAction={() => load(filter)}>
              Try again
            </ActionButton>
          }
        >
          Showing the patches from before. Nothing was lost.
        </InlineMessage>
      ) : null}
      <Region
        label="patch bank"
        busy={busy}
        hasContent={rows !== null}
        minHeight="26rem"
        loadedMessage={rows ? `${rows.length} ${rows.length === 1 ? 'patch' : 'patches'} loaded.` : undefined}
        fallback={<PatchListSkeleton rows={BANK.length} />}
      >
        <PatchList
          filter={filter}
          onFilter={(next) => load(next)}
          rows={rows ?? []}
          selectedId={selected}
          loadingId={null}
          onLoad={(row) => setSelected(row.id)}
          status={status}
          busy={busy}
          dim={busy && rows !== null}
        />
      </Region>
    </div>
  )
}

interface Draft {
  readonly id: string
  readonly title: string
}
const DRAFTS: readonly Draft[] = [
  { id: 'd1', title: 'My Bass 1' },
  { id: 'd2', title: 'Sunday Pad' },
  { id: 'd3', title: 'Broken Lead' },
]

function ToastSequence({ latency, autorun }: DemoProps): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [removed, setRemoved] = useState<readonly string[]>([])
  // the full list's height, measured once, reserves the space for every later state
  const listRef = useRef<HTMLUListElement>(null)
  const [listHeight, setListHeight] = useState<number | undefined>(undefined)
  useLayoutEffect(() => setListHeight(listRef.current?.offsetHeight), [])
  // the story: delete one draft (its Undo toast), delete the rest (the cleared list), Undo the last, then export
  useAutorun(cardRef, autorun, () => {
    const press = (title: string): void =>
      cardRef.current?.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
        if (b.textContent === `Delete ${title}`) b.click()
      })
    press(DRAFTS[0].title)
    window.setTimeout(() => DRAFTS.slice(1).forEach((d) => press(d.title)), 1000)
    window.setTimeout(() => {
      const undo = [...document.querySelectorAll<HTMLButtonElement>('.fb-toasts .fb-toast__button')].filter((b) => b.textContent === 'Undo')
      undo[0]?.click() // the newest toast sits on top
    }, 3000)
    window.setTimeout(() => buttonRef.current?.click(), 5000)
  })
  const remove = (draft: Draft): void => {
    setRemoved((current) => [...current, draft.id])
    toast(`“${draft.title}” deleted.`, {
      id: draft.id,
      action: { label: 'Undo', onClick: () => setRemoved((current) => current.filter((id) => id !== draft.id)) },
      duration: 10000, // the Undo window: at least 10 s
    })
  }
  const visible = DRAFTS.filter((draft) => !removed.includes(draft.id))
  const gone = DRAFTS.filter((draft) => removed.includes(draft.id))
  const raise = (tone: ToastTone, message: string): void => void toast(message, { tone })
  return (
    <div ref={cardRef} className="sys-stack">
      {/* the list, its cleared state and the deleted line keep the full list's space, so deleting and undoing move
          nothing below */}
      <div className="sys-slot" style={{ minBlockSize: listHeight }}>
        <ul ref={listRef} className="sys-list" data-on={visible.length > 0 || undefined}>
          {visible.map((draft) => (
            <li key={draft.id} className="sys-project" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}>
              <span className="sys-project__title">{draft.title}</span>
              <button type="button" className="sys-btn" onClick={() => remove(draft)}>
                Delete<span className="fb-sr"> {draft.title}</span>
              </button>
            </li>
          ))}
        </ul>
        <div data-on={visible.length === 0 || undefined} aria-hidden={visible.length > 0} inert={visible.length > 0}>
          <EmptyState headingLevel={4} kind="cleared" title="All your patches deleted">
            Undo one from its toast while it shows, or restore them all below.
          </EmptyState>
        </div>
      </div>
      <div className="sys-readout">
        {/* a count, not the names, so the line keeps one length */}
        {gone.length ? `Recently deleted: ${gone.length} patch${gone.length === 1 ? '' : 'es'}.` : 'Nothing deleted yet.'}{' '}
        <button type="button" className="sys-btn" aria-disabled={gone.length === 0} onClick={() => gone.length && setRemoved([])}>
          Restore all
        </button>
      </div>
      <div className="sys-controls" role="group" aria-label="Raise a toast">
        <button type="button" className="sys-btn" onClick={() => raise('neutral', 'Patch copied to slot 2.')}>
          Neutral
        </button>
        <button type="button" className="sys-btn" onClick={() => raise('success', 'Bank exported. It is in your downloads.')}>
          Success
        </button>
        <button type="button" className="sys-btn" onClick={() => raise('warning', 'Slot 32 is the last free one.')}>
          Warning
        </button>
        <button type="button" className="sys-btn" onClick={() => raise('error', 'The import stopped at patch 40. Open the report to retry.')}>
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
  // ?outcome=empty and ?network=offline set the start state, so a capture can show those paths without a click
  const [outcome, setOutcome] = useState<Outcome>(() => (new URLSearchParams(window.location.search).get('outcome') === 'empty' ? 'empty' : 'results'))
  const [network, setNetwork] = useState<Network>(() => (new URLSearchParams(window.location.search).get('network') === 'offline' ? 'offline' : 'online'))
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
      <div className="sys-grid sys-grid--scenarios">
        {SCENARIOS.map((entry) => {
          const Demo = SCENARIO_DEMOS[entry.id]
          return (
            <Card key={entry.id} title={entry.title} note={entry.summary} data-sequence={`scenario-${entry.id}`}>
              {Demo ? <Demo latency={latency} outcome={outcome} network={network} autorun={autorun} /> : <Missing kind="scenario" id={entry.id} />}
              <div className="sys-card__foot">
                <p className="sys-meta">
                  <span className="sys-note__lead">What to look for:</span> {entry.watch}
                </p>
                <Heard />
              </div>
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
// Effects: the primitives of the motion language (guides/expression.md)
// ---------------------------------------------------------------------------------------------------------------

function EffectsSection({ autorun }: { autorun: boolean }): JSX.Element {
  return (
    <Section
      id="effects"
      title="Effects"
      lead="The building blocks of the style's motion language. Each situation in MOTION-SYSTEM.md, Theme expression, layers one or more of them, tuned with the --vfx-* knobs. Standing effects show as they rest; one-shots play once in view and again on Play."
    >
      <div className="sys-grid">
        {EFFECTS.map((entry) => (
          <EffectCard key={entry.id} entry={entry} autorun={autorun} />
        ))}
      </div>
    </Section>
  )
}

function EffectCard({ entry, autorun }: { entry: EffectEntry; autorun: boolean }): JSX.Element {
  const target = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const run = useCallback(() => {
    const el = target.current
    if (!el) return
    if (entry.id === 'type-on') void typeOn(el.querySelector<HTMLElement>('[data-type]'), 'SAVED NIGHT BASS')
    else if (entry.kind === 'one-shot') void pulsePlay(el, entry.id as 'invert' | 'power-on' | 'led-flash' | 'clip')
  }, [entry])
  useAutorun(card, autorun && entry.kind !== 'standing', run)
  return (
    <div ref={card}>
      <Card title={entry.title} note={`${entry.summary} Use: ${entry.use}.`} data-sequence={`effect-${entry.id}`}>
        <EffectSample id={entry.id} target={target} />
        {entry.kind === 'standing' ? null : (
          <button type="button" className="sys-btn" onClick={run}>
            Play {entry.title.toLowerCase()}
          </button>
        )}
      </Card>
    </div>
  )
}

/** What each PULSE-1 effect plays on: the part of the instrument it belongs to. */
function EffectSample({ id, target }: { id: string; target: RefObject<HTMLDivElement | null> }): JSX.Element {
  switch (id) {
    case 'invert':
      return (
        <div ref={target} className="sys-effect" data-vfx="invert">
          Turn the sound on
        </div>
      )
    case 'led-flash':
      return (
        <div className="sys-effect">
          <span className="pi-led" data-state="on">
            <span ref={target as RefObject<HTMLSpanElement | null>} className="pi-led__dot" />
            <span className="pi-led__word">Saved</span>
          </span>
        </div>
      )
    case 'led-blink':
      return (
        <div className="sys-effect" ref={target}>
          <span className="pi-led" data-state="blink">
            <span className="pi-led__dot" data-vfx="led-blink" />
            <span className="pi-led__word">Saving</span>
          </span>
        </div>
      )
    case 'type-on':
    case 'clip':
    case 'dots':
      return (
        <div ref={target} className="sys-effect sys-effect--oled pi-oled">
          <span className="pi-oled__l1">
            <span data-type>{id === 'dots' ? 'LOADING' : id === 'clip' ? 'TRY AGAIN' : 'SAVED NIGHT BASS'}</span>
            {id === 'dots' ? <span data-vfx="dots" data-pending /> : null}
          </span>
        </div>
      )
    case 'vent-scan':
      return (
        <div ref={target} className="sys-effect">
          <PatchListSkeletonSample />
        </div>
      )
    case 'spin-step':
      return (
        <div ref={target} className="sys-effect">
          <Spinner size="lg" label="Loading patches" />
        </div>
      )
    case 'dim':
      return (
        <div ref={target} className="sys-effect" data-vfx="dim">
          Offline. New patches stay on this device.
        </div>
      )
    default:
      return (
        <div ref={target} className="sys-effect">
          Module online
        </div>
      )
  }
}

function PatchListSkeletonSample(): JSX.Element {
  return (
    <ul className="pi-bank__list" data-vfx="vent-scan" aria-hidden="true" style={{ inlineSize: '100%' }}>
      {[0, 1, 2].map((i) => (
        <li key={i} className="pi-patch pi-patch--skeleton" style={vars({ '--i': String(i) })}>
          <span className="pi-vent" />
        </li>
      ))}
    </ul>
  )
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
  return (
    <div className="sys-grid">
      <EmptyState
        headingLevel={4}
        kind="first-use"
        title="No patches saved yet"
        action={
          <ActionButton variant="primary" onAction={noop}>
            Save this sound
          </ActionButton>
        }
      >
        Turn a knob, then save the sound: your patches land here, newest first.
      </EmptyState>
      <EmptyState
        headingLevel={4}
        kind="no-results"
        title="No patches match"
        filters={['Bank: FX', 'Yours']}
        action={
          <ActionButton variant="secondary" onAction={noop}>
            Clear filters
          </ActionButton>
        }
      >
        Try another type, or show all patches.
      </EmptyState>
      <EmptyState headingLevel={4} kind="cleared" title="Every patch is synced">
        New sounds you save show up here as they sync.
      </EmptyState>
      <EmptyState
        headingLevel={4}
        kind="locked"
        title="The 128-slot bank lives on the device"
        action={
          <ActionButton variant="primary" onAction={noop}>
            How to plug it in
          </ActionButton>
        }
      >
        Plug PULSE-1 in over USB-C to see and fill all 128 slots. The six factory patches work here.
      </EmptyState>
    </div>
  )
}

function ErrorPagesPattern({ latency }: DemoProps): JSX.Element {
  return (
    <div className="sys-grid">
      <ErrorState title="The bank didn't load" announceOnMount={false} headingLevel={4} onRetry={(signal) => simulate(latency, true, signal)}>
        The connection dropped before the patches arrived. Nothing was lost. Try again.
      </ErrorState>
      <ErrorState title="Page not found" announceOnMount={false} headingLevel={4} secondary={<Link to="/">Back to the start</Link>}>
        The address may have changed or been typed wrong. Check it, or start again from the home page.
      </ErrorState>
      <ErrorState
        title="This page did not load"
        announceOnMount={false}
        headingLevel={4}
        onRetry={(signal) => simulate(latency, true, signal)}
        secondary={<a href="mailto:support@example.com">Contact support</a>}
      >
        The problem is on our side. Your patches are safe. Try again, or contact support.
      </ErrorState>
      <ErrorState title="We are down for maintenance" announceOnMount={false} headingLevel={4} secondary={<Link to="/">Back to the start</Link>}>
        Patch sync is back at 14:00 UTC. Your sounds are saved on the device. Reload then.
      </ErrorState>
    </div>
  )
}

const PATTERN_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  'empty-states': EmptyStatesPattern,
  'error-pages': ErrorPagesPattern,
}
