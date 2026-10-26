import { useId, useState, type ComponentPropsWithoutRef, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'

type Preview = 'hover' | 'focus' | 'pressed'

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'type'> {
  /** One primary per screen; quiet for tertiary actions; danger only for a destructive action. */
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  icon?: IconName
  /** Pins a pointer state for /system. */
  preview?: Preview
  /** Unavailable: stays focusable, says why (COMPONENTS.md, Button). */
  disabledReason?: string
  type?: 'button' | 'submit'
}

/** A local action (no network wait). Async actions use ActionButton from ../feedback. */
export function Button({
  variant = 'secondary',
  icon,
  preview,
  disabledReason,
  children,
  className,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps): JSX.Element {
  const reasonId = useId()
  const disabled = disabledReason !== undefined
  return (
    <>
      <button
        {...rest}
        type={type}
        className={['ea-btn ea-frame ea-edge', className].filter(Boolean).join(' ')}
        data-variant={variant}
        data-preview={preview}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? reasonId : rest['aria-describedby']}
        onClick={disabled ? undefined : onClick}
      >
        {icon ? <Icon name={icon} /> : null}
        {children}
      </button>
      {disabled ? (
        <span id={reasonId} className="ea-sr-only">
          {disabledReason}
        </span>
      ) : null}
    </>
  )
}

/** An icon-only button: always named, always with a visible tooltip on hover and on focus. */
export function IconButton({
  icon,
  label,
  preview,
  onClick,
  variant = 'quiet',
  pressed,
}: {
  icon: IconName
  label: string
  preview?: Preview
  onClick?: () => void
  variant?: 'quiet' | 'secondary'
  pressed?: boolean
}): JSX.Element {
  const [tip, setTip] = useState(false)
  return (
    <span className="ea-tip-host" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
      <button
        type="button"
        className="ea-btn ea-frame ea-edge"
        data-variant={variant}
        data-icon-only=""
        data-preview={preview}
        aria-label={label}
        aria-pressed={pressed}
        onFocus={(event) => setTip(event.currentTarget.matches(':focus-visible'))}
        onBlur={() => setTip(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setTip(false)
        }}
        onClick={onClick}
      >
        <Icon name={icon} size="md" />
      </button>
      {tip || preview === 'focus' ? (
        <span className="ea-tip ea-frame" role="tooltip">
          {label}
        </span>
      ) : null}
    </span>
  )
}

/** A segmented control: one view setting (grid or table, density). Radio-group keyboard pattern. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { id: T; label: string; icon?: IconName }[]
  value: T
  onChange: (next: T) => void
}): JSX.Element {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const index = options.findIndex((option) => option.id === value)
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = options[(index + step + options.length) % options.length]
    onChange(next.id)
    const host = event.currentTarget.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`)
    host?.focus()
  }
  return (
    <div className="ea-seg ea-frame" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          data-id={option.id}
          className="ea-seg__item ea-activeline"
          aria-checked={option.id === value}
          tabIndex={option.id === value ? 0 : -1}
          onClick={() => onChange(option.id)}
        >
          {option.icon ? <Icon name={option.icon} /> : null}
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** A link: navigates. Inline links are underlined; standalone links are gold and bold. */
export function TextLink({
  href,
  children,
  standalone = false,
  external = false,
  current = false,
}: {
  href: string
  children: ReactNode
  standalone?: boolean
  external?: boolean
  current?: boolean
}): JSX.Element {
  return (
    <a className="ea-link" href={href} data-standalone={standalone || undefined} aria-current={current ? 'page' : undefined}>
      {children}
      {external ? (
        <>
          <Icon name="external" />
          <span className="ea-sr-only"> (opens another site)</span>
        </>
      ) : null}
    </a>
  )
}
