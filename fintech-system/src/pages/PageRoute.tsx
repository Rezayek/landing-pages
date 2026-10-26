import { Component, lazy, type ComponentType, type JSX, type LazyExoticComponent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PAGES } from '@/pages/registry'

/**
 * A page's code failed to load (a dropped connection, a new deploy): say so and offer a reload, instead of a blank
 * screen. Plain markup with token fallbacks, because the stylesheet may be the part that failed.
 */
class ChunkBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }
  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <main role="alert" style={{ display: 'grid', placeItems: 'center', minBlockSize: '100vh', padding: '1.5rem', background: 'var(--bg, #f5f2ec)', color: 'var(--ink, #23211e)', fontFamily: 'var(--font-body, system-ui, sans-serif)' }}>
        <div style={{ display: 'grid', gap: '0.75rem', maxInlineSize: '28rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>This page could not load.</h1>
          <p style={{ margin: 0 }}>Reload the page, then try again.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ justifySelf: 'center', minBlockSize: 44, padding: '0 1.25rem', border: 0, borderRadius: 8, background: 'var(--accent, #1f5a45)', color: 'var(--on-accent, #fff)', font: 'inherit', cursor: 'pointer' }}>
            Reload the page
          </button>
        </div>
      </main>
    )
  }
}

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
  return (
    <ChunkBoundary>
      <entry.Page />
    </ChunkBoundary>
  )
}

/** `/system`: the project's design system, shown working. */
export function SystemRoute(): JSX.Element {
  return <ProjectSystem />
}
