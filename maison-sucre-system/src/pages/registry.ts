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
    slug: 'maison-sucre-landing',
    title: 'Maison Sucre: wedding cakes made to order',
    summary: 'Wedding cake maker landing (design study): a rendered camera arrives in a wedding room and climbs a four-tier cake tier by tier to the tasting booking; live-price builder, gallery, flavours, delivery check',
    Page: lazy(() => import('@/pages/maison-sucre-landing/Page')),
  },
]
