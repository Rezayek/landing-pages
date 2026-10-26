import { Link } from 'react-router-dom'
import { PAGES } from '@/pages/registry'

/** The lab's index: every page, newest last. Plain on purpose; the pages carry the design. */
export function Gallery(): React.JSX.Element {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <h1 className="text-3xl font-semibold">{'echo-atlas'}</h1>
      {PAGES.length === 0 ? (
        <p className="text-neutral-600">
          No pages yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {PAGES.map((p) => (
            <li key={p.slug}>
              <Link to={`/p/${p.slug}`} className="block rounded-lg border border-neutral-300 p-5 hover:border-neutral-500">
                <span className="block font-medium">{p.title}</span>
                <span className="block text-sm text-neutral-600">{p.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
