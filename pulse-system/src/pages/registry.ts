import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** Every landing page in the lab. Each one is its own chunk, so pages never ship each other's code. */
export interface PageEntry {
  slug: string
  title: string
  summary: string
  Page: LazyExoticComponent<ComponentType>
}

/** A page module that loads only when its route opens. `lazy(() => import(...))` written inline works the same. */
export function page(load: () => Promise<{ default: ComponentType }>): LazyExoticComponent<ComponentType> {
  return lazy(load)
}

export const PAGES: PageEntry[] = [
  // /ui-ux:new appends one entry per page here, newest last:
  // { slug: 'acme', title: 'Acme', summary: 'One line on the idea.', Page: lazy(() => import('@/pages/acme/Page')) },
  {
    slug: 'pulse-landing',
    title: 'PULSE-1',
    summary: 'Pre-order landing for PULSE-1, a fictional desktop synth: play it in a one-card hero with its own scope, watch it assemble in a full-screen film, try six patches, pre-order (design study, the form sends nothing).',
    Page: lazy(() => import('@/pages/pulse-landing/Page')),
  },
]
