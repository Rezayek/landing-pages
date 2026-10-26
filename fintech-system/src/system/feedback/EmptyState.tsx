import type { JSX, ReactNode } from 'react'
import { InboxIcon, LockIcon, SearchIcon, SuccessIcon } from './icons'
import { cx } from './internal'

/**
 * Four empty states, four different jobs. A failed load is not one of them: that is ErrorState.
 *  - first-use   nothing here yet: say what will appear and give the one action that adds it.
 *  - no-results  the person's filters or search matched nothing: echo them, offer to clear them.
 *  - cleared     the person finished everything: a short, positive line; no action needed.
 *  - locked      the content exists but this person cannot see it (permission, plan): say why and the way in.
 */
export type EmptyKind = 'first-use' | 'no-results' | 'cleared' | 'locked'

export interface EmptyStateProps {
  kind: EmptyKind
  /** A short positive statement: "Add your first project", not "You have no projects". */
  title: string
  /** One or two short sentences that do not repeat the title. */
  children?: ReactNode
  /** The one primary action: a button with an imperative verb. */
  action?: ReactNode
  /** A quieter second path: a link to help or the other way in. */
  secondary?: ReactNode
  /** `no-results` only: the filters in force, so the person sees why nothing matched. */
  filters?: readonly string[]
  /** `no-results` only: remove one filter (each chip gets a Remove button that says which). */
  onRemoveFilter?: (filter: string) => void
  headingLevel?: 2 | 3 | 4
  /** Replace the default icon. */
  icon?: ReactNode
  className?: string
}

const ICONS: Record<EmptyKind, () => JSX.Element> = {
  'first-use': InboxIcon,
  'no-results': SearchIcon,
  cleared: SuccessIcon,
  locked: LockIcon,
}

/**
 * Replaces the list, table, feed or chart it stands for, in the same reserved space (`--fb-region-min`), so
 * nothing shifts when content arrives. Never show it while data is still loading, and never leave a region blank.
 */
export function EmptyState({
  kind,
  title,
  children,
  action,
  secondary,
  filters,
  onRemoveFilter,
  headingLevel = 3,
  icon,
  className,
}: EmptyStateProps): JSX.Element {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'
  const Icon = ICONS[kind]
  return (
    <div className={cx('fb fb-state', className)} data-kind={kind}>
      <span className="fb-state__icon">{icon ?? <Icon />}</span>
      <Heading className="fb-state__title">{title}</Heading>
      {children ? <p className="fb-state__body">{children}</p> : null}
      {kind === 'no-results' && filters?.length ? (
        <ul className="fb-state__filters" aria-label="Active filters">
          {filters.map((filter) => (
            <li key={filter} className="fb-chip" data-removable={onRemoveFilter ? 'true' : undefined}>
              {filter}
              {onRemoveFilter ? (
                <button type="button" className="fb-chip__remove" aria-label={`Remove filter: ${filter}`} onClick={() => onRemoveFilter(filter)}>
                  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {action || secondary ? (
        <div className="fb-state__actions">
          {action}
          {secondary}
        </div>
      ) : null}
    </div>
  )
}
