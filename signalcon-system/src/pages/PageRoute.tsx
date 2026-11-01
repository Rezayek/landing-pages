import { lazy, type ComponentType, type JSX, type LazyExoticComponent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PAGES } from '@/pages/registry'

interface PageSystemProps {
  scope?: string
}

// A page that owns its design system (ui-ux.config.json `systemScope: "page"`) keeps it in
// src/pages/<slug>/system/ and shows it at /p/<slug>/system. Found at build time; nothing matches in a project
// with one system, and the route then points to /system.
const PAGE_SYSTEMS: Record<string, LazyExoticComponent<ComponentType<PageSystemProps>>> = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: ComponentType<PageSystemProps> }>('/src/pages/*/system/SystemPage.tsx')).map(
    ([path, load]) => [path, lazy(load)],
  ),
)

// The project's own system page (systemScope "project"): its own chunk, so no page downloads it.
const ProjectSystem = lazy(() => import('@/system/SystemPage'))

interface PageRouteProps {
  /** Show the page's own system page instead of the page. */
  system?: boolean
}

export function PageRoute({ system = false }: PageRouteProps): JSX.Element {
  const { slug } = useParams()
  const entry = PAGES.find((p) => p.slug === slug)
  const PageSystem = system && slug ? PAGE_SYSTEMS[`/src/pages/${slug}/system/SystemPage.tsx`] : undefined

  if (!entry) {
    return (
      <p className="p-6">
        No page called “{slug}”. <Link to="/">All pages</Link>
      </p>
    )
  }
  if (system) {
    return PageSystem ? (
      <PageSystem scope={entry.slug} />
    ) : (
      <p className="p-6">
        “{entry.title}” has no system of its own. The project system is at <Link to="/system">/system</Link>.
      </p>
    )
  }
  return <entry.Page />
}

/** `/system`: the project's design system, shown working. */
export function SystemRoute(): JSX.Element {
  return <ProjectSystem />
}
