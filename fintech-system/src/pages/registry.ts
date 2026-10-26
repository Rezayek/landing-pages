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
    slug: 'fintech-landing',
    title: 'Kitty waitlist',
    summary: 'Landing page for Kitty, the household payments app: get families to join the waitlist.',
    Page: lazy(() => import('@/pages/fintech-landing/Page')),
  },
]
