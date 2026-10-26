/**
 * Simulated latency for the /system page and for any page without a backend. Feedback only proves itself when the
 * wait is slow, fails or never ends, and real servers rarely do that on demand. Every sequence on the page awaits
 * `simulate()` with the preset the latency control has selected.
 *
 * The presets sit on both sides of the thresholds in guides/interaction.md §Response times in the workflow skill:
 *   fast       150 ms  under the 400 ms show delay: no indicator, only the result
 *   slow       1.5 s   past the delay: the indicator appears, stays at least 500 ms, then the result
 *   very slow  8 s     the longest a single action should run before it becomes a background job
 *   stalled    12 s    past the "Still working" notice (8 s)
 *   fail       1.5 s   the request ends in an error: input is kept, the error is announced, a retry is offered
 *
 * It is a stand-in for the network. In the project's own code use the real client; to test a screen against slow
 * or failing responses, wrap that client with `simulate` (or a mock server's delay) in a dev-only branch.
 */
export type LatencyId = 'fast' | 'slow' | 'very-slow' | 'stalled' | 'fail'

export interface LatencyPreset {
  readonly id: LatencyId
  readonly label: string
  readonly ms: number
  readonly fails: boolean
  /** One line for the control's tooltip or caption: what this setting shows. */
  readonly hint: string
}

export const LATENCY_PRESETS: readonly LatencyPreset[] = [
  { id: 'fast', label: 'Fast', ms: 150, fails: false, hint: 'Under the 400 ms delay: no indicator, only the result.' },
  { id: 'slow', label: 'Slow', ms: 1500, fails: false, hint: 'Past the delay: the indicator shows, then the result.' },
  { id: 'very-slow', label: 'Very slow', ms: 8000, fails: false, hint: 'Eight seconds: the longest an action should run before it becomes a background job.' },
  { id: 'stalled', label: 'Stalled', ms: 12000, fails: false, hint: 'Twelve seconds: past the 8 s "Still working" notice.' },
  { id: 'fail', label: 'Fail', ms: 1500, fails: true, hint: 'The request fails after 1.5 s: input kept, error announced, retry offered.' },
]

export const DEFAULT_LATENCY: LatencyId = 'slow'

/**
 * Read a preset from `?latency=<id>` (`fast`, `slow`, `very-slow`, `stalled`, `fail`). Pages and the /system page
 * use it so a capture script can show any state without a click.
 */
export function parseLatency(value: string | null | undefined): LatencyId | null {
  const id = value?.trim().toLowerCase().replace(/[_\s]+/g, '-')
  return LATENCY_PRESETS.find((preset) => preset.id === id)?.id ?? null
}

export function presetFor(id: LatencyId): LatencyPreset {
  return LATENCY_PRESETS.find((preset) => preset.id === id) ?? LATENCY_PRESETS[1]
}

/** The error a failing simulated request rejects with. */
export class SimulatedFailure extends Error {
  constructor(message = 'The simulated request failed.') {
    super(message)
    this.name = 'SimulatedFailure'
  }
}

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Resolve after `ms`, or reject with an AbortError as soon as `signal` fires. */
export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const done = (): void => {
      signal?.removeEventListener('abort', stop)
      resolve()
    }
    const stop = (): void => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(done, ms)
    signal?.addEventListener('abort', stop, { once: true })
  })
}

/**
 * Pretend to call a server: wait for the preset's time, then resolve with `value`, or reject with a
 * SimulatedFailure when the preset fails. Cancellable with `signal`.
 */
export async function simulate<T>(latency: LatencyId, value: T, signal?: AbortSignal): Promise<T> {
  const preset = presetFor(latency)
  await wait(preset.ms, signal)
  if (preset.fails) throw new SimulatedFailure()
  return value
}
