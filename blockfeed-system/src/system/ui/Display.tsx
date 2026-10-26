import { useId, type CSSProperties, type HTMLAttributes, type JSX, type ReactNode } from 'react'
import { Pixels } from '../pixel/art'
import { Icon } from '../pixel/Icon'
import type { GlyphName, IconName } from '../pixel/icons'
import { avatarArt } from '../pixel/textures'
import './ui.css'

export type Tone = 'neutral' | 'version' | 'accent' | 'positive' | 'negative' | 'warning' | 'info'

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: Tone
  readonly icon?: IconName | GlyphName
}

/** A short label: a version, a mode, a region, a status. A status tag always carries an icon and a word. */
export function Tag({ tone = 'neutral', icon, children, className, ...rest }: TagProps): JSX.Element {
  return (
    <span {...rest} className={`bf-tag${className ? ` ${className}` : ''}`} data-tone={tone === 'neutral' ? undefined : tone}>
      {icon ? <Icon name={icon} size="sm" /> : null}
      {children}
    </span>
  )
}

/** A filter chip: a tag you can press. */
export function TagButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }): JSX.Element {
  return (
    <button type="button" className="bf-tag" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}

/** An unread count: a red box with the number, over 99 it reads 99+. `quiet` is the same count with no alarm colour. */
export function Count({ value, tone = 'alert' }: { value: number; tone?: 'alert' | 'quiet' }): JSX.Element {
  return (
    <span className="bf-count bf-num" style={tone === 'quiet' ? ({ background: 'var(--face)', color: 'var(--face-ink)' } as CSSProperties) : undefined}>
      {value > 99 ? '99+' : value}
    </span>
  )
}

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'
const AVATAR_CELL: Record<AvatarSize, number> = { sm: 2, md: 3, lg: 4, xl: 8 }

/** A blocky 8 x 8 face drawn from the name, so the same player always looks the same. */
export function Avatar({ name, size = 'md', presence, decorative }: { name: string; size?: AvatarSize; presence?: 'online' | 'away' | 'off'; decorative?: boolean }): JSX.Element {
  const art = avatarArt(name)
  return (
    <span className="bf-avatar">
      <Pixels rows={art.rows} colors={art.colors} cell={AVATAR_CELL[size]} label={decorative ? undefined : `${name}'s avatar`} />
      {presence ? (
        <span className="bf-avatar__presence" data-state={presence === 'online' ? undefined : presence} role="img" aria-label={presence === 'online' ? 'Online' : presence === 'away' ? 'Away' : 'Offline'} />
      ) : null}
    </span>
  )
}

/** The player level: a green number with a black outline, the way experience is shown in the game. */
export function Level({ value }: { value: number }): JSX.Element {
  return (
    <span className="bf-level bf-num">
      <span aria-hidden="true">Lv {value}</span>
      <span className="bf-sr">Level {value}</span>
    </span>
  )
}

export interface XpBarProps {
  readonly value: number
  readonly max: number
  /** what the bar measures, spoken and (with `showLabel`) shown: "Level 12, 340 of 500 XP" */
  readonly label: string
  readonly indeterminate?: boolean
  readonly showLabel?: boolean
}

/** The experience bar: a black frame, a green fill in segments, stepped fill motion. Used for progress and for shares. */
export function XpBar({ value, max, label, indeterminate, showLabel }: XpBarProps): JSX.Element {
  const p = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const labelId = useId()
  return (
    <span className="bf-stack" style={{ '--bf-gap': 'var(--space-1)' } as CSSProperties}>
      {showLabel ? (
        <span className="bf-label bf-num" id={labelId}>
          {label}
        </span>
      ) : null}
      <span
        className="bf-xp"
        style={{ '--p': p } as CSSProperties}
        data-indeterminate={indeterminate ? '' : undefined}
        role="progressbar"
        aria-labelledby={showLabel ? labelId : undefined}
        aria-label={showLabel ? undefined : label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuetext={indeterminate ? 'Working' : label}
      >
        <span className="bf-xp__fill" />
      </span>
    </span>
  )
}

/** Five bars for a server's latency, with the number beside them: the bars are never the only signal. */
export function Ping({ ms }: { ms: number | null }): JSX.Element {
  const quality = ms === null ? 'bad' : ms <= 80 ? 'good' : ms <= 160 ? 'mid' : 'bad'
  const lit = ms === null ? 0 : ms <= 40 ? 5 : ms <= 80 ? 4 : ms <= 120 ? 3 : ms <= 160 ? 2 : 1
  return (
    <span className="bf-row bf-row--nowrap" style={{ '--bf-gap': 'var(--space-2)' } as CSSProperties}>
      <span className="bf-ping" data-quality={quality === 'good' ? undefined : quality} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} data-off={i < lit ? undefined : ''} />
        ))}
      </span>
      <span className="bf-num">{ms === null ? 'No signal' : `${ms} ms`}</span>
    </span>
  )
}
