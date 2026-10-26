/**
 * Page-wide motion pause (MOTION-SYSTEM.md, "Motion pause", v5; WCAG 2.2.2). One button stops everything on the page
 * that runs by itself: a live 3D scene, rain, a scripted product session, lightning arcs. The state is kept for the
 * visit (sessionStorage), so a reload does not restart what the person stopped.
 *
 *   <MotionPauseProvider> wraps the page; <MotionPauseButton /> sits in the header (and again where the phone needs
 *   it); anything that runs by itself reads `useMotionPaused()` and stops its loop when it is true.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { announce } from '../feedback'
import { cx } from '../feedback/internal'
import './marketing.css'

const KEY = 'voltcart-motion-paused'

interface PauseState {
  paused: boolean
  toggle: () => void
}

const PauseContext = createContext<PauseState>({ paused: false, toggle: () => {} })

function readStored(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function MotionPauseProvider({ children }: { children: ReactNode }): JSX.Element {
  const [paused, setPaused] = useState(readStored)
  const toggle = useCallback(() => {
    setPaused((was) => {
      const next = !was
      try {
        sessionStorage.setItem(KEY, next ? '1' : '0')
      } catch {
        /* storage blocked: the choice lasts until reload */
      }
      announce(next ? 'Motion paused' : 'Motion playing')
      return next
    })
  }, [])
  useEffect(() => {
    document.documentElement.toggleAttribute('data-motion-paused', paused)
    return () => document.documentElement.removeAttribute('data-motion-paused')
  }, [paused])
  const value = useMemo(() => ({ paused, toggle }), [paused, toggle])
  return <PauseContext.Provider value={value}>{children}</PauseContext.Provider>
}

export function useMotionPaused(): boolean {
  return useContext(PauseContext).paused
}

function PauseGlyph({ paused }: { paused: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="square" aria-hidden="true">
      {paused ? <path d="M7 5v14l11-7z" /> : <path d="M8 5v14M16 5v14" />}
    </svg>
  )
}

/** A quiet text button whose label says what it will do: "Pause motion" / "Play motion" (no aria-pressed as well). */
export function MotionPauseButton({ className }: { className?: string }): JSX.Element {
  const { paused, toggle } = useContext(PauseContext)
  return (
    <button type="button" className={cx('vc-pause', className)} data-paused={paused || undefined} onClick={toggle}>
      <span className="vc-icon">
        <PauseGlyph paused={paused} />
      </span>
      {paused ? 'Play motion' : 'Pause motion'}
    </button>
  )
}
