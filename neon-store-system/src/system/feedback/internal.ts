import { useEffect, useRef, type CSSProperties } from 'react'

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** An inline style that carries CSS custom properties (React's CSSProperties has no index for `--x`). */
export function cssVars(vars: Record<`--${string}`, string | number | undefined>): CSSProperties {
  return vars as unknown as CSSProperties
}

/**
 * The newest value of a prop or callback, readable from timers and async code without re-running effects.
 * Updated after each render.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

/** The text of a label when it is a plain string, else the fallback. Used for announcements. */
export function textOf(node: unknown, fallback = ''): string {
  return typeof node === 'string' ? node : fallback
}
