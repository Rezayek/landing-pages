import { createContext, useContext, type JSX, type ReactNode } from 'react'

/**
 * Demo scope: when a component is shown inside a /system card, it is not the page. Landmarks get a unique name
 * ("Main, App shell demo"), the shell renders no second <main>, and section titles step below the card's own h3.
 * Outside a scope (a real page) nothing changes.
 */
interface Scope {
  readonly name: string | null
}

const ScopeContext = createContext<Scope>({ name: null })

export function DemoScope({ name, children }: { name: string; children: ReactNode }): JSX.Element {
  return <ScopeContext.Provider value={{ name }}>{children}</ScopeContext.Provider>
}

/** The landmark's accessible name, made unique inside a demo. */
export function useLandmarkLabel(label: string): string {
  const { name } = useContext(ScopeContext)
  return name ? `${label}, ${name} demo` : label
}

/** True inside a demo card. */
export function useInDemo(): boolean {
  return useContext(ScopeContext).name !== null
}
