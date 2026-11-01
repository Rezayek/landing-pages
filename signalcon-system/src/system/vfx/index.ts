/**
 * Effect primitives for the system's motion language (guides/expression.md). Import from here so the stylesheet
 * comes with them. The style's own effects (built in phase 8 from the style contract) live next to these.
 */
import './vfx.css'
import './signal.css'

export { burst, decode, play, reducedMotion } from './vfx'
export type { OneShot } from './vfx'
export { armReveals, flip, tuneIn } from './signal'
