import { useEffect, useId, useMemo, useRef, useState, type JSX, type ReactNode } from 'react'
import { FEEDBACK_TIMING, announce, toast } from '../feedback'
import { buildShot } from '../pixel/textures'
import { Avatar, Button, IconButton, Level, Menu, Panel, Tag } from '../ui'
import { playerById, type Build } from './fixtures'
import './social.css'

const WHAT: Record<Build['structure'], string> = {
  tower: 'a stone tower',
  cottage: 'a cottage',
  castle: 'a castle',
  bridge: 'a bridge',
  lighthouse: 'a lighthouse',
  pyramid: 'a pyramid',
}
const WHERE: Record<Build['biome'], string> = {
  meadow: 'a green meadow',
  desert: 'a desert',
  snow: 'a snowfield',
  dusk: 'a dusk sky',
  night: 'a night sky',
  coast: 'a coast',
}

/** A build screenshot in an inventory-slot frame. The picture is a drawn landscape; real posts carry a player's own image. */
export function BuildShot({ build, wide }: { build: Build; wide?: boolean }): JSX.Element {
  const src = useMemo(() => buildShot(build.shot, build.biome, build.structure), [build.shot, build.biome, build.structure])
  return (
    <span className="bf-shot" data-wide={wide ? '' : undefined}>
      <img className="bf-shot__img" src={src} width={64} height={36} alt={`Screenshot: ${WHAT[build.structure]} against ${WHERE[build.biome]}`} />
    </span>
  )
}

/**
 * A value people copy: a seed, coordinates, a server address. It reads in the number font and copies with one press.
 * The answer is written in place, beside the button: "Copied" for the success hold, or, when the clipboard is blocked,
 * the value is selected and the field says how to copy it. Both are announced; no toast (a result shows where it
 * happened, INTERACTION.md).
 */
export function CopyField({ label, value, copy }: { label: string; value: string; copy?: string }): JSX.Element {
  const [said, setSaid] = useState<'ok' | 'fail' | null>(null)
  const valueRef = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  function rest(state: 'ok' | 'fail', hold: number): void {
    clearTimeout(timer.current)
    setSaid(state)
    timer.current = setTimeout(() => setSaid(null), hold)
  }
  async function onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(copy ?? value)
      rest('ok', FEEDBACK_TIMING.successHoldMs)
      announce(`${label} copied`)
    } catch {
      const el = valueRef.current
      if (el) {
        const range = document.createRange()
        range.selectNodeContents(el)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
      }
      rest('fail', FEEDBACK_TIMING.successHoldMs * 4)
      announce('Select the text and copy it')
    }
  }
  return (
    <div className="bf-copy" data-copied={said ?? undefined}>
      <span className="bf-copy__label">{label}</span>
      <span className="bf-copy__value bf-num" ref={valueRef}>
        {value}
      </span>
      <IconButton icon="copy" size="sm" variant="ghost" label={`Copy ${label.toLowerCase()}`} onClick={onCopy} />
    </div>
  )
}

export interface LikeButtonProps {
  readonly liked: boolean
  readonly count: number
  readonly onToggle: () => void
  /** what is liked, for the accessible name: "Lantern Keep" */
  readonly subject: string
}

/**
 * The like button. It is a toggle: the heart fills, the count moves by one, and `aria-pressed` carries the state, so it
 * is never colour alone. The change is optimistic: the caller flips `liked` at once and undoes it if the request fails.
 */
export function LikeButton({ liked, count, onToggle, subject }: LikeButtonProps): JSX.Element {
  return (
    <Button
      size="sm"
      icon={liked ? 'heart' : 'heartEmpty'}
      className="bf-like"
      aria-pressed={liked}
      aria-label={`Like ${subject}: ${count.toLocaleString()}`}
      data-fx="like"
      onClick={onToggle}
    >
      <span className="bf-num">{count.toLocaleString()}</span>
    </Button>
  )
}

function Who({ id, onOpen, children }: { id: string; onOpen?: (id: string) => void; children: ReactNode }): JSX.Element {
  return onOpen ? (
    <button type="button" className="bf-link" onClick={() => onOpen(id)}>
      {children}
    </button>
  ) : (
    <span>{children}</span>
  )
}

export interface BuildCardProps {
  readonly build: Build
  readonly liked?: boolean
  readonly saved?: boolean
  readonly onLike?: () => void
  readonly onSave?: () => void
  readonly onOpen?: (id: string) => void
  readonly onOpenPlayer?: (id: string) => void
  readonly onReport?: (id: string) => void
}

/**
 * A build in the feed: the screenshot, the title, who made it, the version and tags, the seed and the coordinates (so
 * anyone can go and see it) and the actions. The title is the one link into the post.
 */
export function BuildCard({ build, liked = false, saved = false, onLike, onSave, onOpen, onOpenPlayer, onReport }: BuildCardProps): JSX.Element {
  const titleId = useId()
  const author = playerById(build.author)
  const likes = build.likes + (liked ? 1 : 0)
  const [x, y, z] = build.coords
  return (
    <Panel as="article" flush className="bf-card" aria-labelledby={titleId}>
      <div className="bf-card__media">
        <BuildShot build={build} />
        {build.featured ? (
          <Tag tone="warning" icon="crown" className="bf-card__badge">
            {build.featured}
          </Tag>
        ) : null}
      </div>
      <h3 id={titleId} className="bf-card__title">
        {onOpen ? (
          <button type="button" className="bf-link" onClick={() => onOpen(build.id)}>
            {build.title}
          </button>
        ) : (
          build.title
        )}
      </h3>
      <div className="bf-card__by">
        <Avatar name={author.name} size="sm" decorative />
        <div className="bf-card__who">
          <div className="bf-row">
            <Who id={author.id} onOpen={onOpenPlayer}>
              {author.name}
            </Who>
            <Level value={author.level} />
          </div>
          <span className="bf-subtle">{build.posted}</span>
        </div>
      </div>
      <div className="bf-row">
        <Tag tone="version">{build.version}</Tag>
        <Tag>{build.mode}</Tag>
        {build.tags.map((t) => (
          <Tag key={t}>#{t}</Tag>
        ))}
      </div>
      <div className="bf-facts">
        <CopyField label="Seed" value={build.seed} />
        <CopyField label="Coordinates" value={`${x}, ${y}, ${z}`} copy={`${x} ${y} ${z}`} />
      </div>
      <div className="bf-card__actions">
        <LikeButton liked={liked} count={likes} subject={build.title} onToggle={() => onLike?.()} />
        <Button size="sm" icon="comment" aria-label={`${build.comments} comments on ${build.title}`} onClick={() => onOpen?.(build.id)}>
          <span className="bf-num">{build.comments.toLocaleString()}</span>
        </Button>
        <span className="bf-grow" />
        <IconButton icon="bookmark" size="sm" label={saved ? `Remove ${build.title} from saved` : `Save ${build.title}`} pressed={saved} onClick={() => onSave?.()} />
        <Menu
          label={`More about ${build.title}`}
          items={[
            { id: 'share', label: 'Share build', icon: 'share', onSelect: () => toast('Link copied', { id: 'copied', tone: 'success' }) },
            { id: 'report', label: 'Report build', icon: 'flag', danger: true, onSelect: () => onReport?.(build.id) },
          ]}
        />
      </div>
    </Panel>
  )
}

/** The feed layout: cards fill the width and wrap, every card the same width. */
export function BuildGrid({ children, label }: { children: ReactNode; label: string }): JSX.Element {
  return (
    <section className="bf-feed" aria-label={label}>
      {children}
    </section>
  )
}
