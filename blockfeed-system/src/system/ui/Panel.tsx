import type { HTMLAttributes, JSX, ReactNode } from 'react'
import './ui.css'

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** raised is the lighter step for a dialog or a menu that sits on another panel */
  tone?: 'surface' | 'raised'
  /** floats with a hard shadow: `overlay` for dialogs and menus */
  lift?: boolean | 'overlay'
  /** the small label at the top of an inventory panel */
  title?: ReactNode
  /** less padding, for a panel that holds a dense list */
  flush?: boolean
  bare?: boolean
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header'
}

/** The inventory panel: a one-unit frame, a lit top-left edge, a shaded bottom-right edge and notched corners. */
export function Panel({ tone = 'surface', lift, title, flush, bare, as: Tag = 'div', children, className, ...rest }: PanelProps): JSX.Element {
  const panel = (
    <Tag
      {...rest}
      className={`bf-panel${className ? ` ${className}` : ''}`}
      data-tone={tone === 'raised' ? 'raised' : undefined}
      data-flush={flush ? '' : undefined}
      data-bare={bare ? '' : undefined}
    >
      {title ? <h3 className="bf-panel__title">{title}</h3> : null}
      {children}
    </Tag>
  )
  if (!lift) return panel
  return (
    <div className="bf-lift" data-level={lift === 'overlay' ? 'overlay' : undefined}>
      {panel}
    </div>
  )
}

/** A slot-gray well set into a panel: the inverse bevel. `dark` is the black field used by lists and inputs. */
export function Well({ dark, children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { dark?: boolean }): JSX.Element {
  return (
    <div {...rest} className={`bf-well${className ? ` ${className}` : ''}`} data-dark={dark ? '' : undefined}>
      {children}
    </div>
  )
}

export function Rule(): JSX.Element {
  return <hr className="bf-rule" />
}
