import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type DragEvent, type JSX } from 'react'
import { announce, toast } from '../feedback'
import { useLatest } from '../feedback/internal'
import { preset, springFor } from '../motion'
import { IconButton } from './Button'
import { Combobox } from './Select'
import { ElementMark, RarityMark, ResonatorCard } from './Data'
import { RESONATORS, byId, fullBodyOf, portraitOf, type EchoSlotData, type Resonator } from './sample'
import { Icon, Sigil } from './icons'

/**
 * Echo slot: one of five positions (cost 4, 3, 3, 1, 1). Empty says what fits; filled lists the main and
 * substats; warning (cost over budget) and error (main stat the cost cannot have) have icon and words. Reorder with
 * Move up and Move down (no drag needed).
 */
export function EchoSlot({
  slot,
  index,
  state = slot.name ? 'filled' : 'empty',
  message,
  onEdit,
  onMove,
  syncing,
}: {
  slot: EchoSlotData
  index: number
  state?: 'empty' | 'filled' | 'warning' | 'error' | 'selected'
  message?: string
  onEdit?: () => void
  onMove?: (dir: -1 | 1) => void
  syncing?: 'waiting' | 'syncing' | 'synced'
}): JSX.Element {
  return (
    <motion.li layout transition={springFor('default')} className="ea-slot ea-frame ea-edge ea-ticks" data-state={state} data-selected={state === 'selected' || undefined}>
      <div style={{ display: 'grid', gap: 'var(--space-1)', minInlineSize: 0 }}>
        <div className="ea-slot__head">
          <span className="ea-slot__cost">Cost {slot.cost}</span>
          {slot.name ? <span className="ea-slot__name">{slot.name}</span> : <span>Add a cost {slot.cost} Echo</span>}
          {slot.set ? <span style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>{slot.set}</span> : null}
          {syncing === 'waiting' ? <span style={{ color: 'var(--muted)', fontSize: 'var(--step--2)' }}>Waiting to sync</span> : null}
        </div>
        {slot.name ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1) var(--space-4)', fontSize: 'var(--step--1)' }} data-numeric="">
            <strong>{slot.main}</strong>
            {slot.subs.map(([stat, v], i) => (
              // a slot can roll the same stat twice (flat ATK and ATK %), so the key carries the position
              <span key={`${i}-${stat}`} style={{ color: 'var(--muted)' }}>
                {stat} {v}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="ea-slot__actions">
        {onMove ? (
          <>
            <IconButton icon="chevronUp" label={`Move slot ${index + 1} up`} onClick={() => onMove(-1)} />
            <IconButton icon="chevronDown" label={`Move slot ${index + 1} down`} onClick={() => onMove(1)} />
          </>
        ) : null}
        <IconButton icon={slot.name ? 'edit' : 'plus'} label={slot.name ? `Edit ${slot.name}` : `Add a cost ${slot.cost} Echo`} onClick={onEdit} />
      </div>
      {message ? (
        <span className="ea-fld__msg ea-slot__msg" data-tone={state === 'error' ? 'error' : 'warning'}>
          <Icon name={state === 'error' ? 'error' : 'warning'} />
          {message}
        </span>
      ) : null}
      <span className="ea-ticks__mark" aria-hidden="true" />
    </motion.li>
  )
}

const ROLES = ['Main DPS', 'Sub DPS', 'Support'] as const

/** Team slot: empty prompt, filled (compact card + remove), drop target while dragging, duplicate error. */
export function TeamSlot({
  index,
  resonator,
  state,
  error,
  onRemove,
  onDrop,
  onFocusPick,
  exclude = [],
}: {
  index: number
  resonator: Resonator | null
  state?: 'target'
  error?: string | null
  onRemove?: () => void
  onDrop?: (id: string) => void
  onFocusPick?: (r: Resonator) => void
  /** Resonators already in the team: left out of this slot's search rather than offered and then refused. */
  exclude?: readonly string[]
}): JSX.Element {
  const [over, setOver] = useState(false)
  const look = error ? 'error' : state === 'target' || over ? 'target' : resonator ? 'filled' : 'empty'
  return (
    <li
      className="ea-tslot ea-frame"
      data-state={look}
      data-team-slot={index}
      onDragOver={(event: DragEvent) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event: DragEvent) => {
        event.preventDefault()
        setOver(false)
        const id = event.dataTransfer.getData('text/plain')
        if (id) onDrop?.(id)
      }}
    >
      <span className="ea-tslot__role">
        Slot {index + 1} · {ROLES[index]}
      </span>
      {resonator ? (
        <>
          {/* the Resonator's art fills the slot's right side, fading in from the edge as on the banner cards: the
              portrait card, else the full-body cut-out cropped to head and shoulders, else the element sigil */}
          <span className="ea-tslot__portrait" aria-hidden="true">
            {portraitOf(resonator.id) ? (
              <img src={portraitOf(resonator.id)!} alt="" width={366} height={731} loading="lazy" decoding="async" />
            ) : fullBodyOf(resonator.id) ? (
              <img src={fullBodyOf(resonator.id)!} alt="" width={1536} height={1524} loading="lazy" decoding="async" data-crop="full" />
            ) : (
              <Sigil element={resonator.element} size="xl" />
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Sigil element={resonator.element} size="lg" />
            <div style={{ display: 'grid' }}>
              <strong>{resonator.name}</strong>
              <span style={{ display: 'flex', gap: 'var(--space-2)', color: 'var(--muted)' }}>
                <ElementMark element={resonator.element} />
                <RarityMark rarity={resonator.rarity} />
              </span>
            </div>
          </div>
          <span>
            <IconButton icon="close" label={`Remove ${resonator.name} from slot ${index + 1}`} onClick={onRemove} />
          </span>
        </>
      ) : onFocusPick ? (
        <Combobox
          label="Place a Resonator"
          placeholder="Search Resonators"
          clearOnSelect
          options={RESONATORS.filter((r) => !exclude.includes(r.id)).map((r) => ({ id: r.id, label: r.name, lead: <Sigil element={r.element} /> }))}
          onSelect={(option) => onFocusPick(byId(option.id))}
        />
      ) : (
        <span style={{ color: 'var(--muted)' }}>Place a Resonator</span>
      )}
      {error ? (
        <span className="ea-fld__msg" data-tone="error">
          <Icon name="error" />
          {error}
        </span>
      ) : null}
    </li>
  )
}

/**
 * Team builder: three slots and a picker. Three routes to place a Resonator: drag a card onto a slot; select a card
 * and press "Place in slot n" (the click alternative); or use the combobox in an empty slot (keyboard). Removing
 * offers Undo; placing announces "Jinhsi placed in slot 1"; a duplicate is refused on the slot.
 */
export function TeamBuilder({
  pool = RESONATORS.slice(0, 8),
  onChange,
}: {
  pool?: readonly Resonator[]
  /** Told the team after every change, for a readout beside the builder. */
  onChange?: (team: readonly (Resonator | null)[]) => void
}): JSX.Element {
  const [team, setTeam] = useState<(Resonator | null)[]>([byId('jinhsi'), null, null])
  const report = useLatest(onChange)
  useEffect(() => report.current?.(team), [team, report])
  const [picked, setPicked] = useState<Resonator | null>(null)
  const [errors, setErrors] = useState<(string | null)[]>([null, null, null])
  const slots = useRef<HTMLUListElement>(null)

  function place(slot: number, r: Resonator): void {
    const already = team.findIndex((x) => x?.id === r.id)
    if (already >= 0 && already !== slot) {
      const message = `${r.name} is already in slot ${already + 1}. Pick another Resonator, or clear slot ${already + 1} first.`
      setErrors((e) => e.map((v, i) => (i === slot ? message : v)))
      announce(message, 'assertive')
      return
    }
    setTeam((t) => t.map((x, i) => (i === slot ? r : x)))
    setErrors([null, null, null])
    setPicked(null)
    announce(`${r.name} placed in slot ${slot + 1}`)
  }
  function remove(slot: number): void {
    const gone = team[slot]
    if (!gone) return
    setTeam((t) => t.map((x, i) => (i === slot ? null : x)))
    // an error about the old team no longer holds
    setErrors([null, null, null])
    // the remove button leaves with the card: focus stays on the slot, in its search field
    window.requestAnimationFrame(() => slots.current?.querySelector<HTMLElement>(`[data-team-slot="${slot}"] input`)?.focus())
    toast(`${gone.name} removed from slot ${slot + 1}`, {
      action: {
        label: 'Undo',
        onClick: () => {
          setTeam((t) => t.map((x, i) => (i === slot ? gone : x)))
          announce(`${gone.name} is back in slot ${slot + 1}.`)
          // focus returns to the restored card, on its remove button
          window.requestAnimationFrame(() => slots.current?.querySelector<HTMLElement>(`[data-team-slot="${slot}"] button`)?.focus())
        },
      },
      duration: 10_000,
    })
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--gap-group)' }}>
      <ul className="ea-team" ref={slots}>
        {team.map((r, i) => (
          <TeamSlot
            key={i}
            index={i}
            resonator={r}
            error={errors[i]}
            onRemove={() => remove(i)}
            onDrop={(id) => place(i, byId(id))}
            onFocusPick={(res) => place(i, res)}
            exclude={team.flatMap((x) => (x ? [x.id] : []))}
          />
        ))}
      </ul>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center', minBlockSize: 'var(--tap-min)' }}>
        <span style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>
          {picked ? `${picked.name} selected.` : 'Drag a card to a slot, or select one and place it.'}
        </span>
        {picked
          ? team.map((_, i) => (
              <button key={i} type="button" className="ea-btn ea-frame ea-edge" data-variant="secondary" onClick={() => place(i, picked)}>
                Place in slot {i + 1}
              </button>
            ))
          : null}
      </div>
      <ul className="ea-grid">
        <AnimatePresence initial={false}>
          {pool.map((r, i) => (
            <motion.li
              key={r.id}
              {...preset.listItem}
              style={{ ['--i' as string]: i }}
              draggable
              onDragStart={(event) => (event as unknown as DragEvent).dataTransfer?.setData('text/plain', r.id)}
            >
              <ResonatorCard resonator={r} size="compact" selected={picked?.id === r.id} onSelect={() => {
                  setPicked(picked?.id === r.id ? null : r)
                  // a new pick starts clean: the last refusal was about another card
                  setErrors([null, null, null])
                }}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
