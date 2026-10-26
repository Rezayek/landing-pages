import type { JSX, ReactNode } from 'react'
import { Icon } from './icons'

const ICON = { warning: 'offline', positive: 'check', info: 'info', negative: 'error' } as const

/**
 * Banner (global under the band, page, or section): a state of the app or page: offline, back online,
 * maintenance, new version data, signed out. Sweeps in by --travel-sm; pushes content down, never covers it.
 * `role="alert"` only when an action is required.
 */
export function Banner({
  tone,
  children,
  action,
  urgent = false,
  icon,
}: {
  tone: 'warning' | 'positive' | 'info' | 'negative'
  children: ReactNode
  action?: ReactNode
  urgent?: boolean
  icon?: 'offline' | 'check' | 'info' | 'error' | 'warning' | 'clock'
}): JSX.Element {
  return (
    <div className="ea-banner" data-tone={tone} role={urgent ? 'alert' : 'status'}>
      <span className="ea-banner__text">
        <Icon name={icon ?? ICON[tone]} size="md" />
        <span>{children}</span>
      </span>
      {action}
    </div>
  )
}
