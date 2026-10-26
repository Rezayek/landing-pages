import { forwardRef, type ButtonHTMLAttributes, type JSX, type ReactNode } from 'react'
import { Icon } from '../pixel/Icon'
import type { IconName } from '../pixel/icons'
import './ui.css'

export type ButtonVariant = 'secondary' | 'primary' | 'danger' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  icon?: IconName
}

/** The bevelled button. `primary` is used once per screen: it is the one thing the screen is for. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', block, icon, children, className, type = 'button', ...rest },
  ref,
): JSX.Element {
  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      className={`bf-btn${className ? ` ${className}` : ''}`}
      data-variant={variant === 'secondary' ? undefined : variant}
      data-size={size === 'md' ? undefined : size}
      data-block={block ? '' : undefined}
    >
      {icon ? <Icon name={icon} shadow /> : null}
      {children}
    </button>
  )
})

export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'children'> {
  icon: IconName
  /** the accessible name: an icon button has no visible text */
  label: string
  pressed?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, pressed, variant = 'secondary', size = 'md', className, type = 'button', ...rest },
  ref,
): JSX.Element {
  return (
    <button
      ref={ref}
      type={type}
      {...rest}
      aria-label={label}
      aria-pressed={pressed}
      className={`bf-btn${className ? ` ${className}` : ''}`}
      data-variant={variant === 'secondary' ? undefined : variant}
      data-size={size === 'md' ? undefined : size}
      data-icon=""
    >
      <Icon name={icon} shadow />
    </button>
  )
})

export interface SegmentedProps<T extends string> {
  readonly label: string
  readonly value: T
  readonly onChange: (value: T) => void
  readonly options: readonly { readonly value: T; readonly label: ReactNode }[]
}

/** One choice from a few, always visible. Each option is a button; the chosen one is pressed and filled. */
export function Segmented<T extends string>({ label, value, onChange, options }: SegmentedProps<T>): JSX.Element {
  return (
    <div className="bf-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <Button key={o.value} size="sm" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </Button>
      ))}
    </div>
  )
}
