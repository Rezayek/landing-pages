import type { JSX } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { preset, reducedMotionSetting } from '../motion'

/**
 * The tick (MOTION-SYSTEM.md, Patterns): the check settles on spring.playful while its stroke draws. Used only for
 * money arriving, an approval, payday and a goal reached. `play` changes key to replay it. Under reduced motion the
 * check is simply there.
 */
export function Tick({ label, play = 0 }: { label?: string; play?: number }): JSX.Element {
  return (
    <MotionConfig reducedMotion={reducedMotionSetting()}>
      <span className="k-tick" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <svg key={play} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5 10 17.5 19 7" {...preset.tick} />
        </svg>
      </span>
    </MotionConfig>
  )
}
