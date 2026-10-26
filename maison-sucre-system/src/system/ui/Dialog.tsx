import { useEffect, useRef, type JSX, type ReactNode } from 'react'
import { CloseIcon } from '../feedback/icons'
import { durationMs, prefersReducedMotion } from '../motion'
import { IconButton } from './Button'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
}

/** --dur-modal-out (= --dur-lg): the class animation reads the token; this only waits for it to end. */
const EXIT_MS = durationMs.lg

/**
 * A cake's details (COMPONENTS.md §Dialog): native `<dialog>.showModal()` (inert background, Esc, focus trap), a
 * centred panel on desktop and a bottom sheet on phones (ms-dialog in ui.css: roles `modal` and `sheet`). Opening
 * focuses the heading; closing returns focus to the control that opened it. The scrim closes it too.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null
      dialog.removeAttribute('data-closing')
      dialog.showModal()
      heading.current?.focus()
    } else if (!open && dialog.open) {
      const finish = (): void => {
        dialog.close()
        dialog.removeAttribute('data-closing')
        opener.current?.focus()
      }
      if (prefersReducedMotion()) finish()
      else {
        dialog.setAttribute('data-closing', '')
        window.setTimeout(finish, EXIT_MS)
      }
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className="ms-dialog"
      aria-labelledby="ms-dialog-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="ms-dialog__head">
        {/* no title, no heading: a closed dialog never leaves an empty h2 in the outline */}
        {title ? (
          <h2 id="ms-dialog-title" ref={heading} tabIndex={-1} className="ms-display">
            {title}
          </h2>
        ) : null}
        <IconButton label="Close" icon={<CloseIcon />} onClick={onClose} />
      </div>
      <div className="ms-dialog__body">{children}</div>
      {actions ? <div className="ms-dialog__actions">{actions}</div> : null}
    </dialog>
  )
}
