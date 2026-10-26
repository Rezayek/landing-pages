/**
 * The page's one shared build (agreed round 1, A3): the hero's sockets, the S2 build panel and the S3 planner read and
 * write the same five slots, so a change in one shows in the others. It starts from `?build=` when a copied link opened
 * the page, else from her sample build.
 */
import { createContext, useContext, useMemo, useState, type JSX, type ReactNode } from 'react'
import { HER_SLOTS, decodeBuild, encodeBuild, type BuildSlot } from './data'

interface SharedBuild {
  readonly slots: readonly BuildSlot[]
  readonly changed: boolean
  setSlot: (index: number, slot: BuildSlot) => void
  reset: () => void
  /** This page's address with the build in it, for "Copy build link". */
  link: () => string
}

const Build = createContext<SharedBuild | null>(null)

export function BuildProvider({ children }: { children: ReactNode }): JSX.Element {
  const [slots, setSlots] = useState(() => decodeBuild(new URLSearchParams(window.location.search).get('build')))
  const value = useMemo<SharedBuild>(
    () => ({
      slots,
      changed: encodeBuild(slots) !== encodeBuild(HER_SLOTS),
      setSlot: (index, slot) => setSlots((current) => current.map((s, i) => (i === index ? slot : s))),
      reset: () => setSlots(HER_SLOTS),
      link: () => {
        const url = new URL(window.location.href)
        url.searchParams.set('build', encodeBuild(slots))
        url.hash = ''
        return url.toString()
      },
    }),
    [slots],
  )
  return <Build.Provider value={value}>{children}</Build.Provider>
}

export function useBuild(): SharedBuild {
  const value = useContext(Build)
  if (!value) throw new Error('useBuild needs <BuildProvider>')
  return value
}
