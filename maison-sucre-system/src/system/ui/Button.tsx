import type { AnchorHTMLAttributes, ButtonHTMLAttributes, JSX, ReactNode } from 'react'
import { cx } from '../feedback/internal'

/** States the /system page can pin for a still view (COMPONENTS.md §Button). */
export type Preview = 'hover' | 'focus' | 'pressed'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: 'primary' | 'secondary' | 'quiet'
  size?: 'default' | 'large'
  icon?: ReactNode
  /** Unavailable: stays focusable with `aria-disabled`; say why in `disabledReason` (read on focus). */
  disabled?: boolean
  disabledReason?: string
  preview?: Preview
}

/**
 * An action that does not wait on the network (COMPONENTS.md §Button). One primary per screen. A navigation is a
 * Link; an action that waits is an ActionButton (feedback/).
 */
export function Button({
  variant = 'secondary',
  size = 'default',
  icon,
  disabled,
  disabledReason,
  preview,
  className,
  children,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      {...rest}
      type={type}
      className={cx('ms-btn', className)}
      data-variant={variant}
      data-size={size === 'large' ? 'large' : undefined}
      data-preview={preview}
      aria-disabled={disabled || undefined}
      aria-description={disabled ? disabledReason : undefined}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      {icon}
      {children}
    </button>
  )
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'aria-label'> {
  /** The accessible name and the visible tooltip: verb and noun ("Turn the cake left"). */
  label: string
  icon: ReactNode
  /** A toggle: `aria-pressed`. */
  pressed?: boolean
  disabled?: boolean
  disabledReason?: string
  /** A word shown beside the icon while something is in flight ("Keeping…"). */
  word?: string
  preview?: Preview
}

/** A single-icon action with a name and a tooltip that opens on hover (after a delay) and on focus. */
export function IconButton({
  label,
  icon,
  pressed,
  disabled,
  disabledReason,
  word,
  preview,
  className,
  onClick,
  ...rest
}: IconButtonProps): JSX.Element {
  return (
    <button
      {...rest}
      type="button"
      className={cx('ms-iconbtn', className)}
      aria-label={label}
      aria-pressed={pressed}
      aria-disabled={disabled || undefined}
      aria-description={disabled ? disabledReason : undefined}
      data-preview={preview}
      onClick={(event) => {
        if (disabled) return
        onClick?.(event)
      }}
    >
      {icon}
      <span className="ms-tip" aria-hidden="true">
        {disabled && disabledReason ? disabledReason : label}
      </span>
      {word ? <span className="ms-iconbtn__word">{word}</span> : null}
    </button>
  )
}

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** A link that stands alone (not inside a sentence): bolder, with a target of 24 px or more. */
  standalone?: boolean
  current?: boolean
}

/** Navigation (COMPONENTS.md §Link): underlined in running text, named by where it goes. */
export function TextLink({ standalone, current, className, children, ...rest }: TextLinkProps): JSX.Element {
  return (
    <a {...rest} className={cx('ms-link', className)} data-standalone={standalone || undefined} aria-current={current || undefined}>
      {children}
    </a>
  )
}
