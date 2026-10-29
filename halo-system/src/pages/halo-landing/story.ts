/**
 * The scroll story's shared state (MOTION.md Plan): written by the sections' ScrollTriggers and the hero's controls,
 * read every frame by the 3D scene. A plain mutable object, so scroll never re-renders React.
 */
import type { Build } from '@/system/halo'
import { DEFAULT_BUILD } from '@/system/halo'

export interface Story {
  /** S2 coming into view: 0 while the hero fills the screen, 1 when the teardown pins. */
  enter2: number
  /** The teardown: 0 assembled … 5, one layer per step. */
  tear: number
  /** S3 coming into view: the layers close and the watch goes onto the wrist. */
  enter3: number
  /** The worn moments: 0 … 4 (run, night, pool, message). */
  moment: number
  /** S4 coming into view: the watch leaves the wrist for the configurator's shot. */
  enter4: number
  /** The hero's turn, in radians: where the drag or the turn buttons asked it to be. */
  yawTarget: number
  /** Is a drag in progress (the sway waits). */
  dragging: boolean
  paused: boolean
  reduced: boolean
  /** The build chosen in S4 and S5: the story's watch wears it too. */
  build: Build
  /** The configurator's dial: which of the six faces (FACES) the watch shows. */
  faceIndex: number
  /** A pre-order is placed: the halo ring stays closed in every scene. */
  ordered: boolean
}

export const story: Story = {
  enter2: 0,
  tear: 0,
  enter3: 0,
  moment: 0,
  enter4: 0,
  yawTarget: 0,
  dragging: false,
  paused: false,
  reduced: false,
  build: DEFAULT_BUILD,
  faceIndex: 0,
  ordered: false,
}

/** The four still views the turn buttons step through, in order (A5). */
export const VIEWS = ['Front', 'Side dial', 'Back', 'Band side'] as const

export function viewOf(yaw: number): (typeof VIEWS)[number] {
  const i = ((Math.round(yaw / (Math.PI / 2)) % 4) + 4) % 4
  return VIEWS[i]
}

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)
export const smooth = (x: number): number => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}
