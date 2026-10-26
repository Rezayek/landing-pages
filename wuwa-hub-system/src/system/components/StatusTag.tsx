import type { JSX } from 'react'
import { WavePath } from '../feedback/Spinner'
import { Icon } from './icons'

export type StatusKind = 'saved' | 'saving' | 'offline' | 'syncing' | 'synced' | 'ends-soon' | 'rerun' | 'live' | 'failed'

const LOOK: Readonly<Record<StatusKind, { tone?: 'positive' | 'negative' | 'warning' | 'info'; icon?: 'check' | 'warning' | 'offline' | 'clock' | 'sync' | 'error' | 'star'; wave?: boolean; still?: boolean }>> = {
  saved: { tone: 'positive', icon: 'check' },
  saving: { wave: true },
  offline: { tone: 'warning', icon: 'offline', still: true },
  syncing: { tone: 'info', wave: true },
  synced: { tone: 'positive', icon: 'check' },
  'ends-soon': { tone: 'warning', icon: 'clock' },
  rerun: { icon: 'sync' },
  live: { tone: 'info', icon: 'star' },
  failed: { tone: 'negative', icon: 'error' },
}

/**
 * Status tag: a short state of an object, always icon (or waveform) plus a word. Sync uses an inline waveform while
 * it runs (MOTION-SYSTEM.md, Background job); offline shows a still wave: changes are waiting, nothing is moving.
 */
export function StatusTag({ kind, children }: { kind: StatusKind; children: string }): JSX.Element {
  const look = LOOK[kind]
  return (
    <span className="ea-status ea-frame" data-tone={look.tone}>
      {look.wave ? (
        <span className="ea-wave" aria-hidden="true">
          <WavePath />
        </span>
      ) : look.icon ? (
        <Icon name={look.icon} />
      ) : null}
      {children}
    </span>
  )
}
