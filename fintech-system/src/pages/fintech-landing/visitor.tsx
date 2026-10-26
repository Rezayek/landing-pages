/**
 * What the visitor did on this page, shared by the sections: approving Ivy's request in the hero is the one decision
 * they make, and its stamp travels with them (the story's ledger, the week, the slip at the end). Sample only:
 * nothing leaves the page.
 */
import { createContext, type JSX, type ReactNode, useContext, useMemo, useState } from 'react'

interface Visitor {
  approved: boolean
  setApproved: (approved: boolean) => void
}

const VisitorContext = createContext<Visitor>({ approved: false, setApproved: () => {} })

export function VisitorProvider({ children }: { children: ReactNode }): JSX.Element {
  const [approved, setApproved] = useState(false)
  const value = useMemo(() => ({ approved, setApproved }), [approved])
  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>
}

export function useVisitor(): Visitor {
  return useContext(VisitorContext)
}
