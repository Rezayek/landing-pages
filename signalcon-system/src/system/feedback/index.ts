/**
 * The reference feedback components. Import from here (`./feedback` inside the system folder, or the system
 * folder's path from a page), never from the individual files, so the stylesheet always comes with them.
 *
 *   usePending    delay before an indicator shows, minimum time it stays
 *   Spinner  Skeleton  ProgressBar        loading indicators
 *   Region                                one loading region: skeleton on first load, dim + bar on refresh
 *   ActionButton                          idle, pending, success, error, disabled; no double submit; announces
 *   toast()  ToastRegion  ToastCard       short, non-modal, auto-dismissing results
 *   InlineMessage  EmptyState  ErrorState messages and states next to the content they are about
 *   LiveRegion  announce()                what screen readers hear
 *
 * Mount <LiveRegion /> once per app, and <ToastRegion /> once where toasts are used.
 */
import './feedback.css'

export { ActionButton } from './ActionButton'
export type { ActionButtonProps, ActionPreview, ActionState } from './ActionButton'
export { announce, useAnnouncements } from './announcer'
export type { Announcement, Politeness, Spoken } from './announcer'
export { EmptyState } from './EmptyState'
export type { EmptyKind, EmptyStateProps } from './EmptyState'
export { ErrorState } from './ErrorState'
export type { ErrorStateProps } from './ErrorState'
export { InlineMessage } from './InlineMessage'
export type { InlineMessageProps } from './InlineMessage'
export { LiveRegion } from './LiveRegion'
export { ProgressBar } from './ProgressBar'
export type { ProgressBarProps } from './ProgressBar'
export { Region } from './Region'
export type { RegionProps } from './Region'
export { Skeleton } from './Skeleton'
export type { SkeletonProps } from './Skeleton'
export { Spinner } from './Spinner'
export type { SpinnerProps } from './Spinner'
export { toast, toastDuration, useToasts } from './toast'
export type { ToastAction, ToastItem, ToastOptions, ToastTone } from './toast'
export { ToastCard, ToastRegion } from './ToastRegion'
export type { ToastCardProps, ToastRegionProps } from './ToastRegion'
export { FEEDBACK_TIMING, usePending, useSlow } from './usePending'
export type { PendingOptions } from './usePending'
