import { useId, type JSX, type ReactNode } from 'react'
import type { IconName } from '../pixel/icons'
import { Avatar, Button, Count, Icon, IconButton, Level, Menu, Panel, Tag, XpBar } from '../ui'
import { BuildShot } from './Build'
import { playerById, type Build, type Notification, type Player } from './fixtures'
import './social.css'

export interface FollowButtonProps {
  readonly name: string
  readonly following: boolean
  readonly onToggle: () => void
  readonly size?: 'sm' | 'md'
}

/**
 * Follow is a toggle. The visible word changes ("Follow", "Following"); the accessible name stays "Follow <name>" and
 * `aria-pressed` carries the state. The change is optimistic: the caller flips it at once and undoes it on failure.
 */
export function FollowButton({ name, following, onToggle, size = 'md' }: FollowButtonProps): JSX.Element {
  return (
    <Button variant={following ? 'secondary' : 'primary'} size={size} icon={following ? 'check' : 'plus'} aria-pressed={following} aria-label={`Follow ${name}`} data-fx="follow" onClick={onToggle}>
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}

export interface ProfileHeaderProps {
  readonly player: Player
  readonly following: boolean
  readonly onToggleFollow: () => void
  readonly onMessage?: () => void
  readonly onReport?: () => void
  readonly isMe?: boolean
  /** 1 on a profile page; lower where the header sits inside another page (the /system demo). */
  readonly headingLevel?: 1 | 2 | 3 | 4
}

function Stat({ value, label }: { value: number; label: string }): JSX.Element {
  return (
    <div className="bf-stat">
      <dt className="bf-stat__label">{label}</dt>
      <dd className="bf-stat__value bf-num">{value.toLocaleString()}</dd>
    </div>
  )
}

/** The top of a profile: the face, the name and level, the experience bar, the bio, three counts and the actions. */
export function ProfileHeader({ player, following, onToggleFollow, onMessage, onReport, isMe, headingLevel = 1 }: ProfileHeaderProps): JSX.Element {
  const Heading = `h${headingLevel}` as const
  const followers = player.followers + (following ? 1 : 0)
  return (
    <Panel as="header" className="bf-profile">
      <Avatar name={player.name} size="xl" presence={player.presence} />
      <div className="bf-profile__main">
        <div className="bf-row">
          <Heading className="bf-profile__name">{player.name}</Heading>
          {player.role ? <Tag tone={player.role === 'Moderator' ? 'info' : 'accent'}>{player.role}</Tag> : null}
        </div>
        <div className="bf-row bf-row--nowrap">
          <Level value={player.level} />
          <div className="bf-grow">
            <XpBar value={player.xp} max={player.xpMax} label={`Level ${player.level}: ${player.xp} of ${player.xpMax} XP to level ${player.level + 1}`} />
          </div>
        </div>
        <p className="bf-profile__bio">{player.bio}</p>
        <p className="bf-subtle">Joined {player.joined}</p>
        <dl className="bf-stats" aria-label={`${player.name} in numbers`}>
          <Stat value={followers} label="Followers" />
          <Stat value={player.following} label="Following" />
          <Stat value={player.builds} label="Builds" />
        </dl>
        {isMe ? null : (
          <div className="bf-row">
            <FollowButton name={player.name} following={following} onToggle={onToggleFollow} />
            <Button icon="mail" onClick={onMessage}>
              Message
            </Button>
            <Menu label={`More about ${player.name}`} items={[{ id: 'report', label: 'Report player', icon: 'flag', danger: true, onSelect: () => onReport?.() }]} />
          </div>
        )}
      </div>
    </Panel>
  )
}

export interface GalleryProps {
  readonly builds: readonly Build[]
  readonly label: string
  readonly onOpen?: (id: string) => void
}

/** A profile's builds as a grid of framed screenshots with the title and likes underneath. */
export function Gallery({ builds, label, onOpen }: GalleryProps): JSX.Element {
  return (
    <ul className="bf-gallery" aria-label={label}>
      {builds.map((b) => (
        <li key={b.id}>
          <button type="button" className="bf-tile" onClick={() => onOpen?.(b.id)}>
            <BuildShot build={b} />
            <span className="bf-tile__title">{b.title}</span>
            <span className="bf-tile__meta">
              <Icon name="heart" size="sm" /> <span className="bf-num">{b.likes.toLocaleString()}</span>
              <span className="bf-sr"> likes</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

const KIND_ICON: Record<Notification['kind'], IconName> = {
  like: 'heart',
  comment: 'comment',
  follow: 'user',
  challenge: 'trophy',
  event: 'calendar',
  mention: 'users',
}
const KIND_WORD: Record<Notification['kind'], string> = {
  like: 'Like',
  comment: 'Comment',
  follow: 'New follower',
  challenge: 'Challenge',
  event: 'Event',
  mention: 'Mention',
}

export interface NotificationItemProps {
  readonly item: Notification
  readonly onOpen?: (id: string) => void
}

/**
 * One notification in the style of the game's advancement: a framed icon, the title line, the detail under it. An unread
 * one carries a "New" tag as well as its stronger edge, so it never relies on colour.
 */
export function NotificationItem({ item, onOpen }: NotificationItemProps): JSX.Element {
  const who = item.who ? playerById(item.who) : null
  return (
    <button type="button" className="bf-note" data-unread={item.unread ? '' : undefined} onClick={() => onOpen?.(item.id)}>
      <span className="bf-note__icon" aria-hidden="true">
        <Icon name={KIND_ICON[item.kind]} size="lg" shadow />
      </span>
      <span className="bf-note__body">
        <span className="bf-note__kind">{KIND_WORD[item.kind]}</span>
        <span className="bf-note__text">
          {who ? <strong>{who.name} </strong> : null}
          {item.text}
          {item.target ? <strong> {item.target}</strong> : null}
        </span>
        <span className="bf-subtle">{item.when}</span>
      </span>
      {item.unread ? <Tag tone="accent">New</Tag> : null}
    </button>
  )
}

export function NotificationList({ items, label, onOpen }: { items: readonly Notification[]; label: string; onOpen?: (id: string) => void }): JSX.Element {
  return (
    <ul className="bf-notes" aria-label={label}>
      {items.map((n) => (
        <li key={n.id}>
          <NotificationItem item={n} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}

/** The bell in the top bar: the count rides on it and is part of its name. */
export function Bell({ count, onClick, pressed }: { count: number; onClick?: () => void; pressed?: boolean }): JSX.Element {
  const id = useId()
  return (
    <span className="bf-bell">
      <IconButton id={id} icon="bell" label={count ? `Notifications, ${count} unread` : 'Notifications'} pressed={pressed} onClick={onClick} />
      {count ? (
        <span className="bf-bell__count" aria-hidden="true">
          <Count value={count} />
        </span>
      ) : null}
    </span>
  )
}

export interface PlayerRowProps {
  readonly player: Player
  readonly action?: ReactNode
  readonly onOpen?: (id: string) => void
}

/** A player in a list (search, followers, group members): face, name, level, one line of bio and an action. */
export function PlayerRow({ player, action, onOpen }: PlayerRowProps): JSX.Element {
  return (
    <div className="bf-person">
      <Avatar name={player.name} size="md" presence={player.presence} decorative />
      <div className="bf-person__text">
        <div className="bf-row">
          {onOpen ? (
            <button type="button" className="bf-link bf-person__name" onClick={() => onOpen(player.id)}>
              {player.name}
            </button>
          ) : (
            <strong className="bf-person__name">{player.name}</strong>
          )}
          <Level value={player.level} />
        </div>
        <span className="bf-person__bio">{player.bio}</span>
      </div>
      {action}
    </div>
  )
}
