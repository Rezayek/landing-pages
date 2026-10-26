/**
 * S2 Builds (UX.md §S2, MOTION.md rows "/tp teleport", "Feed: 2 new builds", "Feed card like and save").
 * The feed is the proof: each build shows its seed, version and coordinates, and the coordinate button under each card
 * calls teleportTo(build.id) so the hero plot redraws that build. Like and save are optimistic and local; a save hops
 * (pickup) to the header "Sign in" when the header marks it. "Show 2 new builds" appears after 20 s and inserts two
 * builds at the top, rising in the system's list motion. Sample data only (fixtures.ts), labelled on the page.
 */
import { useEffect, useRef, useState, type JSX } from 'react'
import { announce, InlineMessage } from '@/system/feedback'
import { BuildCard, BuildGrid } from '@/system/social'
import { BUILDS, type Build } from '@/system/social/fixtures'
import { Button, Tooltip } from '@/system/ui'
import { pickup, play } from '@/system/vfx'
import { teleportTo } from './world'
import './builds.css'

/** The feed opens with six builds; two more arrive after a while. */
const FIRST: readonly Build[] = BUILDS.slice(0, 6)
const FRESH: readonly Build[] = BUILDS.slice(6, 8)

const SEE_ALL_NOTE = "Design study: the full feed isn't built here."
const NEW_AFTER_MS = 20_000
const UNDO_SAVE_MS = 10_000

const LIKE = '[data-fx="like"]'
const SAVE = '.bf-card__actions button[aria-pressed]:not([data-fx="like"])'

function toggled(set: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(set)
  if (!next.delete(id)) next.add(id)
  return next
}

export function Builds(): JSX.Element {
  const [liked, setLiked] = useState<ReadonlySet<string>>(new Set())
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set())
  const [removed, setRemoved] = useState<string | null>(null)
  const [offer, setOffer] = useState(false)
  const [inserted, setInserted] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const items = inserted ? [...FRESH, ...FIRST] : FIRST
  const nodes = useRef(new Map<string, HTMLElement>())
  const removeTimer = useRef<number | undefined>(undefined)

  // The "new builds" signal: after 20 s (sample), never before.
  useEffect(() => {
    const timer = window.setTimeout(() => setOffer(true), NEW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    announce(`${FIRST.length} builds loaded`)
    return () => window.clearTimeout(removeTimer.current)
  }, [])

  // After the two builds arrive the button is gone: focus goes to the first new build's coordinates.
  useEffect(() => {
    if (inserted) nodes.current.get(FRESH[0].id)?.querySelector<HTMLElement>('.bl-tp')?.focus()
  }, [inserted])

  const find = (id: string, selector: string): HTMLElement | null => nodes.current.get(id)?.querySelector<HTMLElement>(selector) ?? null

  function toggleLike(id: string): void {
    const next = !liked.has(id)
    setLiked((s) => toggled(s, id))
    if (next) void play(find(id, LIKE), 'pop')
  }

  function toggleSave(id: string): void {
    const next = !saved.has(id)
    setSaved((s) => toggled(s, id))
    window.clearTimeout(removeTimer.current)
    if (next) {
      setRemoved(null)
      const button = find(id, SAVE)
      const target = document.querySelector<HTMLElement>('[data-saved-target]') ?? document.querySelector<HTMLElement>('header [data-variant="ghost"]')
      if (target) void pickup(button?.querySelector<HTMLElement>('.bf-icon') ?? button, target)
      else void play(button, 'pop')
      announce('Added to Saved builds')
    } else {
      setRemoved(id)
      announce('Removed from saved')
      removeTimer.current = window.setTimeout(() => setRemoved(null), UNDO_SAVE_MS)
    }
  }

  function undoRemove(id: string): void {
    window.clearTimeout(removeTimer.current)
    setRemoved(null)
    setSaved((s) => new Set(s).add(id))
    announce('Added to Saved builds')
    window.requestAnimationFrame(() => find(id, SAVE)?.focus())
  }

  function showNew(): void {
    setInserted(true)
    announce('2 new builds added')
  }

  function seeAll(): void {
    if (showAll) announce(SEE_ALL_NOTE)
    else setShowAll(true)
  }

  return (
    <section id="builds" className="bl-section" data-y="48" data-y-label="builds" aria-labelledby="builds-title">
      <div className="bl-inner">
        <header className="bl-head">
          <h2 id="builds-title" className="bl-h2">
            Builds you can visit.
          </h2>
          <p className="bl-lede">
            Every build carries its seed, version and coordinates, so anyone can find the spot and visit it, long after it leaves the top of a feed. Click any coordinates and the lighthouse at the top
            jumps to that build.
          </p>
        </header>

        {/* the signal slot keeps its height: the button comes and goes without moving the list */}
        <div className="bl-feedbar">
          <span className="bl-count bf-num">{items.length} builds loaded</span>
          {offer && !inserted ? (
            <Button size="sm" icon="plus" onClick={showNew}>
              Show 2 new builds
            </Button>
          ) : null}
        </div>

        <BuildGrid label="Builds">
          {items.map((build) => {
            const [x, y, z] = build.coords
            const fresh = inserted && FRESH.includes(build)
            return (
              <div
                key={build.id}
                className="bl-build"
                data-new={fresh ? '' : undefined}
                ref={(el) => {
                  if (el) nodes.current.set(build.id, el)
                  else nodes.current.delete(build.id)
                }}
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget && e.animationName === 'bl-rise') void play(e.currentTarget.querySelector<HTMLElement>('.bl-build__host'), 'pulse')
                }}
              >
                <div className="bl-build__host">
                  <BuildCard
                    build={build}
                    liked={liked.has(build.id)}
                    saved={saved.has(build.id)}
                    onLike={() => toggleLike(build.id)}
                    onSave={() => toggleSave(build.id)}
                  />
                </div>
                {/* the tip opens upwards while the "Removed from saved" notice sits below, so it never covers Undo */}
                <Tooltip content="Show this build at the top of the page" side={removed === build.id ? 'top' : 'bottom'}>
                  <Button
                    block
                    size="sm"
                    icon="pin"
                    className="bl-tp"
                    aria-label={`/tp ${x} ${y} ${z}, ${build.title}`}
                    onClick={() => teleportTo(build.id)}
                  >
                    <span className="bf-num">
                      /tp {x} {y} {z}
                    </span>
                  </Button>
                </Tooltip>
                {removed === build.id ? (
                  <InlineMessage
                    tone="info"
                    action={
                      <Button size="sm" onClick={() => undoRemove(build.id)}>
                        Undo
                      </Button>
                    }
                  >
                    Removed from saved
                  </InlineMessage>
                ) : null}
              </div>
            )
          })}
        </BuildGrid>

        <div className="bl-row">
          <Button onClick={seeAll}>See all of this week&apos;s builds</Button>
        </div>
        {showAll ? <InlineMessage tone="info" announceText={SEE_ALL_NOTE}>{SEE_ALL_NOTE}</InlineMessage> : null}
        <p className="bl-note">Sample builds, invented for this design study.</p>
      </div>
    </section>
  )
}
