import type { JSX } from 'react'
import { useAnnouncements } from './announcer'

/**
 * The persistent, visually hidden live regions that `announce()` fills. Mount it ONCE per app, near the root,
 * so both regions exist (empty) before any message arrives. It renders no visible output.
 *
 * Polite is `role="status"` and assertive is `role="alert"`; neither also sets `aria-live`, because the two
 * together make some screen readers speak twice. Hidden with the clip pattern, never `display: none`.
 */
export function LiveRegion(): JSX.Element {
  const { polite, assertive } = useAnnouncements()
  return (
    <>
      <div role="status" aria-atomic="true" className="fb-sr" data-live="polite">
        {polite}
      </div>
      <div role="alert" aria-atomic="true" className="fb-sr" data-live="assertive">
        {assertive}
      </div>
    </>
  )
}
