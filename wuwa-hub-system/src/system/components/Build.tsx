/**
 * The Resonator build, laid out like the in-game Resonator menu: a vertical tab column (Attributes, Weapon, Echo,
 * Resonance Chain, Forte) and the panel beside it. In-game icons are local copies in public/game/ (gameIcons.ts holds
 * their sources, credited) and fall back to our own icon in the same slot when missing or failing; every number and
 * description is sample text.
 */
import { useId, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { DescriptionList, ElementMark, RarityMark } from './Data'
import { type GameIconKey } from './gameIcons'
import { Icon, Sigil, type IconName } from './icons'
import { byId, portraitOf, type SampleChainNode, type SampleEcho, type SampleSkill, type SampleWeapon } from './sample'
import { SectionTitle } from './SectionTitle'

/** An in-game icon, or our fallback icon in the same box (missing file, load error). */
export function GameIcon({
  icon,
  fallback,
  size = 'md',
  label,
}: {
  icon: GameIconKey | null
  fallback: IconName
  size?: 'sm' | 'md' | 'lg'
  label?: string
}): JSX.Element {
  // Local copy first (public/game/<key>.webp; the source is never hotlinked), our icon otherwise.
  const src = icon ? `/game/${icon}.webp` : null
  const [failed, setFailed] = useState(false)
  return (
    <span className="ea-gicon" data-size={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <Icon name={fallback} size="lg" />
      )}
    </span>
  )
}

/** Weapon card (in-game Weapon tab): icon on its rarity, name, type, level, base ATK, secondary stat, Rank and passive. */
export function WeaponCard({ weapon }: { weapon: SampleWeapon }): JSX.Element {
  return (
    <article className="ea-weapon ea-frame" data-tone="outline" style={{ ['--_rarity' as string]: `var(--rarity-${weapon.rarity})` }}>
      <div className="ea-weapon__art">
        <GameIcon icon={weapon.icon} fallback="weapon" size="lg" />
      </div>
      <div className="ea-weapon__body">
        <div className="ea-weapon__head">
          <h4 className="ea-weapon__name">{weapon.name}</h4>
          <RarityMark rarity={weapon.rarity} />
        </div>
        <span className="ea-weapon__meta">
          {weapon.type} · Lv. {weapon.level}
        </span>
        <DescriptionList
          items={[
            { label: 'Base ATK', value: weapon.baseAtk },
            { label: weapon.secondary[0], value: weapon.secondary[1] },
          ]}
        />
        <div className="ea-weapon__passive">
          <span className="ea-tag" data-tone="accent">
            Rank {weapon.rank}
          </span>
          <p>{weapon.passiveText}</p>
        </div>
      </div>
    </article>
  )
}

/** Sonata effect (in-game Echo tab): the set icon and its 2- and 5-piece bonuses; an active bonus is marked. */
export function SonataEffect({
  name,
  icon,
  pieces,
  equipped,
}: {
  name: string
  icon: GameIconKey
  pieces: readonly (readonly [string, string])[]
  equipped: number
}): JSX.Element {
  return (
    <div className="ea-sonata ea-frame" data-tone="outline">
      <div className="ea-sonata__head">
        <GameIcon icon={icon} fallback="echo" size="sm" />
        <strong>{name}</strong>
        <span className="ea-sonata__count" data-numeric="">
          {equipped}/5
        </span>
      </div>
      <ul>
        {pieces.map(([need, text]) => {
          const active = equipped >= Number.parseInt(need, 10)
          return (
            <li key={need} data-active={active || undefined}>
              <span className="ea-sonata__need">
                {active ? <Icon name="check" /> : <Icon name="minus" />}
                {need}
              </span>
              <span>{text}</span>
              <span className="ea-sr-only">{active ? '(active)' : '(not active)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Echo detail (in-game Echo tab): icon with cost, name and level, the main and fixed stat, up to five substats. */
export function EchoCard({ echo }: { echo: SampleEcho }): JSX.Element {
  return (
    <article className="ea-echo ea-frame" data-tone="outline">
      <div className="ea-echo__head">
        <span className="ea-echo__art">
          <GameIcon icon={echo.icon} fallback="echo" size="lg" />
          <span className="ea-echo__cost" aria-label={`Cost ${echo.cost}`}>
            {echo.cost}
          </span>
        </span>
        <div>
          <h4 className="ea-echo__name">{echo.name}</h4>
          <span className="ea-echo__meta" data-numeric="">
            +{echo.level} · {echo.set}
          </span>
        </div>
      </div>
      <div className="ea-echo__main" data-numeric="">
        <span>{echo.main[0]}</span>
        <strong>{echo.main[1]}</strong>
      </div>
      <DescriptionList items={[{ label: echo.fixed[0], value: echo.fixed[1] }, ...echo.subs.map(([label, value]) => ({ label, value }))]} />
      {echo.subs.length < 5 ? <span className="ea-echo__more">{5 - echo.subs.length} substat slots locked until +25</span> : null}
    </article>
  )
}

/**
 * Echo loadout (in-game Echo tab row): five slots with icon, cost and level; selecting one shows its detail. Arrow
 * keys move along the row (radio-group keys); the cost total sits in the title row.
 */
export function EchoLoadout({ echoes, sonata }: { echoes: readonly SampleEcho[]; sonata: Parameters<typeof SonataEffect>[0] }): JSX.Element {
  const [index, setIndex] = useState(0)
  const row = useRef<HTMLDivElement>(null)
  const cost = echoes.reduce((sum, e) => sum + e.cost, 0)
  function onKey(event: KeyboardEvent<HTMLDivElement>): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + echoes.length) % echoes.length
    setIndex(next)
    row.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }
  return (
    <div className="ea-loadout">
      <SectionTitle level={3} aside={<span data-numeric="">Cost {cost}/12</span>}>
        Echoes
      </SectionTitle>
      <div ref={row} className="ea-loadout__row" role="radiogroup" aria-label="Echo slots" onKeyDown={onKey}>
        {echoes.map((echo, i) => (
          <button
            key={`${echo.name}-${i}`}
            type="button"
            role="radio"
            aria-checked={i === index}
            tabIndex={i === index ? 0 : -1}
            className="ea-loadout__slot ea-ticks"
            data-selected={i === index || undefined}
            aria-label={`Slot ${i + 1}: ${echo.name}, cost ${echo.cost}, +${echo.level}`}
            onClick={() => setIndex(i)}
          >
            <GameIcon icon={echo.icon} fallback="echo" />
            {/* corner marks drawn from data (the label above says it all), so they are not a label split in two */}
            <span className="ea-loadout__cost" aria-hidden="true" data-mark={echo.cost} />
            <span className="ea-loadout__lvl" aria-hidden="true" data-mark={`+${echo.level}`} />
            <span className="ea-ticks__mark" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="ea-loadout__detail">
        <EchoCard echo={echoes[index]} />
        <SonataEffect {...sonata} />
      </div>
    </div>
  )
}

/**
 * Forte (in-game Forte screen): five skill columns (Basic Attack, Resonance Skill, Forte Circuit, Resonance
 * Liberation, Intro Skill) with the two inherent skills above the Forte Circuit and the Outro Skill below. Each node
 * shows its level; the build's level-up priority is a numbered badge (a real sequence). Selecting a node shows its detail.
 */
export function ForteTree({ skills }: { skills: readonly SampleSkill[] }): JSX.Element {
  const [selected, setSelected] = useState(skills.find((s) => s.priority === 1)?.id ?? skills[0].id)
  const columns: readonly SampleSkill['kind'][] = ['Basic Attack', 'Resonance Skill', 'Forte Circuit', 'Resonance Liberation', 'Intro Skill']
  const inherent = skills.filter((s) => s.kind === 'Inherent Skill')
  const outro = skills.find((s) => s.kind === 'Outro Skill')
  const current = skills.find((s) => s.id === selected)!
  const detailId = useId()
  const node = (s: SampleSkill): JSX.Element => (
    <button
      key={s.id}
      type="button"
      className="ea-forte__node ea-ticks"
      data-selected={s.id === selected || undefined}
      aria-pressed={s.id === selected}
      aria-controls={detailId}
      aria-label={`${s.kind}: ${s.name}, level ${s.level} of ${s.max}${s.priority ? `, priority ${s.priority}` : ''}`}
      onClick={() => setSelected(s.id)}
    >
      <span className="ea-forte__icon">
        <GameIcon icon={s.icon} fallback="star" />
      </span>
      <span className="ea-forte__lvl" aria-hidden="true" data-numeric="">
        Lv. {s.level}/{s.max}
      </span>
      {/* a corner badge drawn from data (the node's label says the priority) */}
      {s.priority ? <span className="ea-forte__prio" aria-hidden="true" data-mark={s.priority} /> : null}
      <span className="ea-ticks__mark" aria-hidden="true" />
    </button>
  )
  return (
    <div className="ea-forte">
      <div className="ea-forte__inherent" aria-label="Inherent skills" role="group">
        {inherent.map(node)}
      </div>
      <div className="ea-forte__cols">
        {columns.map((kind) => {
          const s = skills.find((x) => x.kind === kind)
          return (
            <div key={kind} className="ea-forte__col">
              {s ? node(s) : null}
              <span className="ea-forte__kind">{kind}</span>
            </div>
          )
        })}
      </div>
      {outro ? (
        <div className="ea-forte__outro">
          {node(outro)}
          <span className="ea-forte__kind">Outro Skill</span>
        </div>
      ) : null}
      <div id={detailId} className="ea-forte__detail ea-frame" data-tone="outline">
        <span className="ea-tag" data-tone="accent">
          {current.kind}
        </span>
        <h4>{current.name}</h4>
        <span className="ea-forte__lvl" data-numeric="">
          Lv. {current.level}/{current.max}
          {current.priority ? ` · level-up priority ${current.priority}` : ''}
        </span>
        <p>{current.text}</p>
      </div>
    </div>
  )
}

/**
 * Resonance Chain (in-game): six round nodes S1-S6 on a line, each with its in-game icon and name; unlocked ones are
 * lit with the accent ring, the next one is outlined, locked ones are dimmed.
 */
export function ResonanceChain({ nodes, unlocked }: { nodes: readonly SampleChainNode[]; unlocked: number }): JSX.Element {
  return (
    <div className="ea-chain">
      <ol className="ea-chain__line">
        {nodes.map((n, i) => (
          <li key={n.seq} data-state={i < unlocked ? 'unlocked' : i === unlocked ? 'next' : 'locked'}>
            <span className="ea-chain__node">
              <GameIcon icon={n.icon} fallback="link" size="sm" />
            </span>
            <span className="ea-chain__label">{n.seq}</span>
            <span className="ea-chain__name">{n.name}</span>
            <span className="ea-sr-only">{i < unlocked ? 'unlocked' : 'locked'}</span>
          </li>
        ))}
      </ol>
      <p className="ea-chain__note">
        Sequence {unlocked} of {nodes.length}. Builds on this page assume S0 unless a guide says otherwise.
      </p>
    </div>
  )
}

const TABS = [
  { id: 'attributes', label: 'Attributes', icon: 'account' },
  { id: 'weapon', label: 'Weapon', icon: 'weapon' },
  { id: 'echo', label: 'Echo', icon: 'echo' },
  { id: 'chain', label: 'Resonance Chain', icon: 'link' },
  { id: 'forte', label: 'Forte', icon: 'star' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[]

export type BuildTab = (typeof TABS)[number]['id']

/**
 * Build panel: the in-game Resonator menu. A vertical tab column (arrow keys up and down, automatic activation)
 * beside the portrait and the active panel. On phones the column becomes a scrolling row above the panel.
 */
export function BuildPanel({
  build,
  tab: controlled,
  onTab,
  loading = false,
  error,
}: {
  /** A build in the shape of JINHSI_BUILD; its Echoes may be any five (a page that lets people swap them passes its own). */
  build: Omit<typeof import('./sample').JINHSI_BUILD, 'echoes'> & { readonly echoes: readonly SampleEcho[] }
  tab?: BuildTab
  onTab?: (tab: BuildTab) => void
  loading?: boolean
  error?: ReactNode
}): JSX.Element {
  const [own, setOwn] = useState<BuildTab>('attributes')
  const tab = controlled ?? own
  const setTab = (t: BuildTab): void => (onTab ? onTab(t) : setOwn(t))
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const resonator = byId(build.resonator)
  const portrait = portraitOf(build.resonator)
  function onKey(event: KeyboardEvent<HTMLDivElement>): void {
    const i = TABS.findIndex((t) => t.id === tab)
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = TABS[(i + step + TABS.length) % TABS.length].id
    setTab(next)
    list.current?.querySelector<HTMLButtonElement>(`[data-id="${next}"]`)?.focus()
  }
  return (
    // The host is the size container, so .ea-build itself can switch to the phone form (a container cannot query itself).
    <div className="ea-build-host">
    <div className="ea-build">
      <div ref={list} className="ea-build__tabs" role="tablist" aria-label={`${resonator.name} build`} aria-orientation="vertical" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-id={t.id}
            id={`${id}-${t.id}`}
            className="ea-tab ea-activeline"
            data-axis="inline"
            aria-selected={t.id === tab}
            aria-controls={`${id}-panel`}
            tabIndex={t.id === tab ? 0 : -1}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size="md" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="ea-build__stage">
        <div className="ea-build__portrait" aria-hidden="true">
          <span className="ea-field" data-shape="centre" />
          {portrait ? <img src={portrait} alt="" width={366} height={731} /> : <Sigil element={resonator.element} size="xl" />}
        </div>
        <div id={`${id}-panel`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-${tab}`} aria-busy={loading || undefined} className="ea-build__panel" key={tab}>
          {error ? (
            error
          ) : loading ? (
            // The draw-on skeleton of a panel: the outline draws in, the caption tunes, the stat rows breathe.
            <div className="ea-skel ea-build__skel">
              <p className="ea-build__loading">
                <span className="ea-wave" aria-hidden="true">
                  <svg viewBox="0 0 48 12" preserveAspectRatio="none">
                    <path d="M0 6 C3 0 9 0 12 6 S21 12 24 6 S33 0 36 6 S45 12 48 6" fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                  </svg>
                </span>
                Loading {TABS.find((t) => t.id === tab)?.label.toLowerCase()}…
              </p>
              <span className="ea-build__skel-rows" aria-hidden="true">
                {[46, 78, 64, 86, 58, 72].map((w, i) => (
                  <span key={i} className="ea-skel__text" style={{ ['--_w' as string]: `${w}%`, ['--_i' as string]: i }}>
                    Placeholder stat line
                  </span>
                ))}
              </span>
              <span className="ea-skel__line ea-frame" aria-hidden="true" />
            </div>
          ) : tab === 'attributes' ? (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div className="ea-build__who">
                <h3 className="ea-build__name">{resonator.name}</h3>
                <span>
                  Lv. {build.level} · <ElementMark element={resonator.element} /> · {resonator.weapon} · <RarityMark rarity={resonator.rarity} />
                </span>
              </div>
              <div data-density="compact">
                <DescriptionList items={build.attributes.map(([label, value]) => ({ label, value }))} />
              </div>
            </div>
          ) : tab === 'weapon' ? (
            <WeaponCard weapon={build.weapon} />
          ) : tab === 'echo' ? (
            <EchoLoadout echoes={build.echoes} sonata={{ ...build.sonata, equipped: build.echoes.filter((e) => e.set === build.sonata.name).length }} />
          ) : tab === 'chain' ? (
            <ResonanceChain nodes={build.chain.nodes} unlocked={build.chain.unlocked} />
          ) : (
            <ForteTree skills={build.forte} />
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
