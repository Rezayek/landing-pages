/**
 * S2-S6 and the footer (UX.md order), each composed from system components. Copy: UX.md §Sections and copy; actions
 * and waits: UX.md §Action inventory (A6-A18).
 */
import { useEffect, useMemo, useState, type JSX } from 'react'
import { EmptyState, ErrorState, Region, announce } from '@/system/feedback'
import { isAbort, parseLatency, simulate } from '@/system/latency'
import {
  BannerCard,
  BannerCardSkeleton,
  BuildPanel,
  Button,
  Combobox,
  EchoSlot,
  ElementMark,
  GameIcon,
  JINHSI_BUILD,
  KpiTile,
  Logo,
  ResonatorCard,
  SAMPLE_BANNERS,
  SectionTitle,
  TeamBuilder,
  type BuildTab,
  type Resonator,
} from '@/system/components'
import { useBuild } from './build'
import { COST_LIMIT, ECHO_POOL, LINKS, START, costOf, defaultMain, echoOf, slotData, statsOf } from './data'

function Note(): JSX.Element {
  return <p className="tl-note">Free, no ads. Sign in only to save builds.</p>
}

function Primary(): JSX.Element {
  return (
    <div className="tl-actions">
      <a className="ea-btn ea-frame ea-edge" data-variant="primary" href={LINKS.database}>
        Find a Resonator's build
      </a>
    </div>
  )
}

/** S2: her build, opened on the Echo tab, with her ghost behind it. The Echoes are the shared build's. */
export function BuildSection(): JSX.Element {
  const [tab, setTab] = useState<BuildTab>('echo')
  const { slots } = useBuild()
  const build = useMemo(() => ({ ...JINHSI_BUILD, echoes: slots.map(echoOf) }), [slots])
  const forte = [...JINHSI_BUILD.forte].filter((s) => s.priority).sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9))
  return (
    <section id="build" className="tl-section tl-build" aria-labelledby="build-title" data-spy="build">
      <div className="tl-build__ghost" aria-hidden="true">
        <img src="/resonators/full/jinhsi.webp" alt="" width={1536} height={1524} loading="lazy" decoding="async" />
      </div>
      <div className="tl-section__head">
        <SectionTitle level={2} id="build-title">
          What Jinhsi farms, slot by slot.
        </SectionTitle>
        <p className="tl-section__sub">The Echo set, the main stat for each slot, then weapon, Resonance Chain and Forte priority.</p>
      </div>
      <div className="tl-build__grid">
        <div className="ea-build-host">
          <BuildPanel build={build} tab={tab} onTab={setTab} />
        </div>
        {/* the rest of what she farms, beside the Echo panel (agreed round 1, A13) */}
        <aside className="tl-also ea-frame" aria-labelledby="also-title">
          <h3 id="also-title" className="tl-also__title">
            Also in her build
          </h3>
          <div className="tl-also__weapon">
            <GameIcon icon={JINHSI_BUILD.weapon.icon} fallback="weapon" size="lg" />
            <div>
              <strong>{JINHSI_BUILD.weapon.name}</strong>
              <span>
                {JINHSI_BUILD.weapon.type} · {JINHSI_BUILD.weapon.secondary[0]} {JINHSI_BUILD.weapon.secondary[1]}
              </span>
            </div>
          </div>
          <h4 className="tl-also__sub">Forte priority</h4>
          <ol className="tl-also__forte">
            {forte.map((s) => (
              <li key={s.id}>
                <GameIcon icon={s.icon} fallback="star" size="sm" />
                <span>{s.kind}</span>
                <span className="tl-also__level" data-numeric="">
                  {s.level}/{s.max}
                </span>
              </li>
            ))}
          </ol>
          <button type="button" className="ea-link tl-also__more" data-standalone="" onClick={() => setTab('forte')}>
            Open the Forte tab
          </button>
        </aside>
      </div>
      <p className="tl-caption">Sample build. Names are from the game; the numbers are for illustration.</p>
      <Primary />
      <Note />
    </section>
  )
}

/** S3: the planner on the shared build. Pick a slot, then an Echo; the cost and the targets update in place (A7, A8). */
export function PlannerSection(): JSX.Element {
  const { slots, setSlot, reset: resetBuild, changed } = useBuild()
  const [picked, setPicked] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const stats = statsOf(slots)
  const options = useMemo(
    () =>
      Object.entries(ECHO_POOL).map(([key, e]) => ({
        id: key,
        label: e.name,
        lead: <GameIcon icon={e.icon} fallback="echo" size="sm" />,
        meta: `Cost ${e.cost} · ${e.main[0]} ${e.main[1]}`,
      })),
    [],
  )
  function swap(key: string): void {
    const slot = { key, main: defaultMain(key) }
    const next = slots.map((s, i) => (i === picked ? slot : s))
    const cost = costOf(next)
    if (cost > COST_LIMIT) {
      setError(`That Echo would make the cost ${cost} of ${COST_LIMIT}. Swap out a cost 3 or 4 Echo first.`)
      return
    }
    setError(null)
    setSlot(picked, slot)
    announce(`${ECHO_POOL[key].name} in slot ${picked + 1}. Cost ${cost} of ${COST_LIMIT}.`)
  }
  function reset(): void {
    resetBuild()
    setError(null)
    setPicked(0)
    announce("Planner reset to Jinhsi's build.")
    // the slots remount with her build: focus their first edit button once they are there
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>('#planner .ea-slot button')?.focus())
  }
  return (
    // a railed section (round 2): the heading and the stat targets in a rail that stays beside the slots
    <section id="planner" className="tl-section tl-railed tl-planner" aria-labelledby="planner-title" data-spy="planner">
      <div className="tl-rail">
        <div className="tl-section__head">
          <SectionTitle level={2} id="planner-title">
            Plan your five Echoes.
          </SectionTitle>
          <p className="tl-section__sub">Swap an Echo and the cost and the stat targets update in place. No account needed; sign in only to save.</p>
        </div>
        <div className="tl-planner__kpis">
          <KpiTile label="Crit Rate" value={stats.critRate} target={70} answer={stats.critRate < 70} />
          <KpiTile label="Crit DMG" value={stats.critDmg} target={200} />
          <KpiTile label="Energy Regen" value={stats.energy} target={120} />
        </div>
      </div>
      <div className="tl-planner__slots">
        <p className="tl-planner__cost" data-numeric="">
          Cost {costOf(slots)} of {COST_LIMIT}
        </p>
        <ul className="ea-slots">
          {slots.map((slot, i) => (
            <EchoSlot
              key={`${i}-${slot.key}-${slot.main}`}
              slot={slotData(slot)}
              index={i}
              state={i === picked ? (error ? 'error' : 'selected') : undefined}
              message={i === picked && error ? error : undefined}
              onEdit={() => {
                setPicked(i)
                setError(null)
              }}
            />
          ))}
        </ul>
        <Combobox label={`Swap in an Echo for slot ${picked + 1}`} options={options} onSelect={(o) => swap(o.id)} placeholder="Type an Echo name" noun="Echo" clearOnSelect />
        <div className="tl-actions">
          <a className="ea-link" data-standalone="" href={LINKS.planner}>
            Open the Echo planner
          </a>
          <Button variant="secondary" onClick={reset} disabledReason={changed ? undefined : "This is already Jinhsi's sample build."}>
            Reset to Jinhsi's build
          </Button>
        </div>
      </div>
    </section>
  )
}

const ROLES = ['Main DPS', 'Sub DPS', 'Support'] as const

/** The team's readout beside the builder (round 2, the person's pick): who is placed, their elements, the roles open. */
function TeamReadout({ team }: { team: readonly (Resonator | null)[] }): JSX.Element {
  const placed = team.flatMap((r, i) => (r ? [{ r, role: ROLES[i] }] : []))
  const open = team.flatMap((r, i) => (r ? [] : [ROLES[i]]))
  const elements = [...new Set(placed.map(({ r }) => r.element))]
  return (
    <dl className="tl-team-readout ea-frame">
      <div>
        <dt>In the team</dt>
        <dd>
          {placed.map(({ r, role }) => (
            <span key={r.id} className="tl-team-readout__member">
              <strong>{r.name}</strong> <span>{role}</span>
            </span>
          ))}
        </dd>
      </div>
      <div>
        <dt>Elements</dt>
        <dd className="tl-team-readout__marks">
          {elements.map((e) => (
            <ElementMark key={e} element={e} />
          ))}
        </dd>
      </div>
      <div>
        <dt>Roles</dt>
        <dd data-numeric="">
          {placed.length} of 3 filled{open.length ? ` · ${open.join(', ')} open` : ''}
        </dd>
      </div>
    </dl>
  )
}

/** S4: the team builder with Jinhsi in slot 1 (A10, A11), its readout in the rail beside it. */
export function TeamSection(): JSX.Element {
  const [team, setTeam] = useState<readonly (Resonator | null)[]>([])
  return (
    // mirrors S3 (round 3): the builder first, the rail with the live readout on the right
    <section id="team" className="tl-section tl-railed tl-railed--end" aria-labelledby="team-title" data-spy="team">
      <div className="tl-rail">
        <div className="tl-section__head">
          <SectionTitle level={2} id="team-title">
            Put Jinhsi in a team.
          </SectionTitle>
          <p className="tl-section__sub">Three slots: main DPS, sub DPS, support. Pick a Resonator, then place it.</p>
        </div>
        <TeamReadout team={team} />
        <div className="tl-actions">
          <a className="ea-link" data-standalone="" href={LINKS.team}>
            Open the team builder
          </a>
        </div>
      </div>
      <TeamBuilder pool={START} onChange={setTeam} />
    </section>
  )
}
type BannerState = { kind: 'loading' } | { kind: 'ready'; banners: typeof SAMPLE_BANNERS } | { kind: 'failed' }

/** S5: live banners, fetched (simulated with ?latency=) into one reserved space (A13-A16). */
export function BannersSection(): JSX.Element {
  const [state, setState] = useState<BannerState>({ kind: 'loading' })
  const [round, setRound] = useState(0)
  const [live, setLive] = useState(true)
  const params = new URLSearchParams(window.location.search)
  const latency = parseLatency(params.get('latency')) ?? 'fast'
  // ?banners=empty simulates a schedule with nothing announced, so the empty state can be seen and checked
  const empty = params.get('banners') === 'empty'
  useEffect(() => {
    const own = new AbortController()
    simulate(latency, empty ? [] : SAMPLE_BANNERS.slice(0, 2), own.signal)
      .then((banners) => setState({ kind: 'ready', banners }))
      .catch((failure: unknown) => {
        if (!isAbort(failure)) setState({ kind: 'failed' })
      })
    return () => own.abort()
  }, [latency, empty, round])
  const skeletons = (
    <div className="tl-banners__list">
      <BannerCardSkeleton size="featured" />
      <BannerCardSkeleton size="featured" />
    </div>
  )
  const [endsAt] = useState(() => Date.now())
  return (
    // the convene screen: a full-bleed night band, the two banners at their featured size (agreed round 1, A13)
    <div className="tl-band ea-night">
    <section id="banners" className="tl-section tl-banners" aria-labelledby="banners-title" data-spy="banners">
      <div className="tl-section__head">
        <SectionTitle level={2} id="banners-title">
          When each banner ends.
        </SectionTitle>
        <p className="tl-section__sub">Each banner's end time, counted to the second, with the server time beside it.</p>
        <p className="tl-caption">Sample banner dates for this preview.</p>
      </div>
      <Region
        label="banners"
        busy={state.kind === 'loading'}
        hasContent={state.kind === 'ready'}
        loadedMessage={state.kind === 'ready' && state.banners.length === 0 ? 'No next banner announced yet.' : undefined}
        reserve={skeletons}
        fallback={skeletons}
        cover={
          state.kind === 'failed' ? (
            <ErrorState
              title="Couldn't load banners"
              onRetry={() => {
                announce('Trying again.')
                setState({ kind: 'loading' })
                setRound((n) => n + 1)
              }}
              focusOnMount={false}
            >
              Check your connection and try again.
            </ErrorState>
          ) : null
        }
      >
        {state.kind === 'ready' && state.banners.length === 0 ? (
          <EmptyState
            kind="first-use"
            title="No next banner announced yet."
            action={
              <a className="ea-btn ea-frame ea-edge" data-variant="secondary" href="#build">
                Open Jinhsi's build while you wait
              </a>
            }
          >
            The schedule for the next phase isn't out yet. Its end times will count down here.
          </EmptyState>
        ) : state.kind === 'ready' ? (
          <div className="tl-banners__list">
            {state.banners.map((b) => (
              <BannerCard
                key={b.id}
                size="featured"
                kind={b.kind}
                title={b.title}
                resonatorId={b.resonator}
                endsAt={endsAt + b.endsInMs}
                rerun={b.rerun}
                liveSeconds={live}
                onLiveSecondsChange={setLive}
                action={
                  b.resonator ? (
                    <a className="ea-link" data-standalone="" href={LINKS.build(b.resonator)}>
                      Open {b.title}'s build
                    </a>
                  ) : undefined
                }
              />
            ))}
          </div>
        ) : null}
      </Region>
    </section>
    </div>
  )
}

/** S6: start with a Resonator (A17) and the final primary. */
export function StartSection(): JSX.Element {
  return (
    <section id="start" className="tl-section" aria-labelledby="start-title">
      <div className="tl-section__head">
        <SectionTitle level={2} id="start-title">
          Start with the Resonator you just pulled.
        </SectionTitle>
      </div>
      {/* one roster row of portrait plates, like the in-game Resonator list (agreed round 1, A13) */}
      <ul className="tl-start">
        {START.map((r) => (
          <li key={r.id}>
            <ResonatorCard resonator={r} href={LINKS.build(r.id)} />
          </li>
        ))}
      </ul>
      <div className="tl-close">
        <Primary />
        <ul className="tl-facts">
          <li>Free, no ads. Sign in only to save builds.</li>
          <li>Works in the browser on phone and desktop. No app to install.</li>
          <li>Builds here are samples. Each real build will show the patch it was checked on.</li>
          <li>Unofficial fan project, not affiliated with Kuro Games.</li>
        </ul>
        <p className="tl-caption">32 Resonators in the database (sample set).</p>
      </div>
    </section>
  )
}

export function PageFooter(): JSX.Element {
  return (
    <footer className="tl-footer">
      <Logo />
      <p>
        Echo Atlas is an unofficial fan project. It isn't affiliated with or endorsed by Kuro Games. Wuthering Waves, its
        names and characters belong to their owners.
      </p>
      <p>
        Character art and in-game icons belong to Kuro Games. Shown with credit, not for profit.{' '}
        <a className="ea-link" href={LINKS.credits}>
          Art credits
        </a>
      </p>
    </footer>
  )
}
