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
    slug: 'blockfeed-landing',
    title: 'Blockfeed landing',
    summary: 'Landing page for Blockfeed, the unofficial builders\' community: a night world you can build in, the week\'s builds with their coordinates, the challenge vote and the server finder',
    Page: lazy(() => import('@/pages/blockfeed-landing/Page')),
  },
]
