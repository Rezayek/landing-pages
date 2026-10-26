/** Header and footer (UX.md §Header, §Footer). The header action is secondary: it focuses the hero's field (A7). */
import type { JSX } from 'react'
import { Logo } from '@/system/ui'

export function Header({ onAnchor, onJoin }: { onAnchor: (id: string) => void; onJoin: () => void }): JSX.Element {
  const links = [
    { id: 'how-it-works', label: 'How it works' },
    { id: 'for-kids', label: 'For kids' },
    { id: 'questions', label: 'Questions' },
  ]
  return (
    <header className="fl-header">
      <Logo href="#top" />
      <nav aria-label="Main" className="fl-nav">
        <ul>
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  onAnchor(link.id)
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <button type="button" className="k-btn fl-header__join" data-variant="secondary" onClick={onJoin}>
        Join the waitlist
      </button>
    </header>
  )
}

export function PageFooter({ onAnchor }: { onAnchor: (id: string) => void }): JSX.Element {
  return (
    <footer className="fl-footer">
      <p>Kitty isn’t open yet. Every household, name and amount on this page is a sample.</p>
      <p>
        <a
          href="#questions"
          className="k-link"
          onClick={(event) => {
            event.preventDefault()
            onAnchor('questions')
          }}
        >
          Questions
        </a>
        <span aria-hidden="true"> · </span>© 2026 Kitty
      </p>
    </footer>
  )
}
