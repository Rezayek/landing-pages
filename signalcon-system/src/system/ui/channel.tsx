/**
 * Channel card and its copy-link control (COMPONENTS.md §Channel card). The card is one composed object made to be
 * screenshotted and shared: a CRT band with the channel number, the art (a Screen the caller passes), an ON AIR tape,
 * the name plate and a sign-off. CopyLink copies the card's own address and, when the clipboard refuses, says in
 * words where the link is. SaveCard turns the card into a PNG a fan can post (channel-image.ts, loaded on demand).
 */
import { type JSX, type ReactNode, type Ref, useCallback, useEffect, useRef, useState } from 'react'
import { ActionButton, type ActionPreview } from '../feedback'
import type { ChannelImageSpec } from './channel-image'
import { Tape, Wordmark } from './primitives'

export type ChannelTone = 'signal' | 'acid' | 'cyan'

export function ChannelCard({
  channel,
  tone = 'signal',
  art,
  onAir,
  name,
  role,
  dates,
  place,
  ref,
}: {
  /** "CH 28" */
  channel: string
  tone?: ChannelTone
  /** a Screen with the portrait (4:5) */
  art: ReactNode
  /** "Sat 13:00" */
  onAir: string
  name: string
  role: string
  /** "23–25.07.27" */
  dates: string
  /** "Relay Hall · Sample" */
  place: string
  ref?: Ref<HTMLDivElement>
}): JSX.Element {
  return (
    <div ref={ref} className="sc-chcard" data-tone={tone}>
      <div className="sc-chcard-band" aria-hidden>
        <span className="sg-split">{channel}</span>
        <span>SIGNAL//CON 2027</span>
      </div>
      <div className="sc-chcard-art">
        {art}
        {/* the tape never takes the band's colour */}
        <Tape tone={tone === 'signal' ? 'acid' : 'signal'} tilt={-4} slam className="sc-chcard-onair">
          On air · {onAir}
        </Tape>
      </div>
      <div className="sc-chcard-plate">
        <p className="sc-chcard-name">{name}</p>
        <p className="sc-chcard-role">{role}</p>
      </div>
      <div className="sc-chcard-foot" aria-hidden>
        <Wordmark />
        <span className="sc-chcard-when">
          <span>{dates}</span>
          <span>{place}</span>
        </span>
      </div>
    </div>
  )
}

/** Copies `url`; key it by the card so a new card starts idle. `preview` pins a state for /system. */
export function CopyLink({
  url,
  hash,
  name,
  preview,
}: {
  url: string
  /** the end of the address, shown when the copy is refused: "#ch-28" */
  hash: string
  name: string
  preview?: Extract<ActionPreview, 'idle' | 'pending' | 'success' | 'error'>
}): JSX.Element {
  const [failed, setFailed] = useState(false)
  return (
    <div className="sc-copylink">
      <ActionButton
        variant="secondary"
        preview={preview}
        onAction={async () => {
          await navigator.clipboard.writeText(url)
          setFailed(false)
        }}
        pendingLabel="Copying…"
        successLabel="Link copied"
        successMessage={`Link to ${name}'s channel copied`}
        errorMessage={() => "Couldn't copy. The link to this channel is in the address bar."}
        onError={() => setFailed(true)}
      >
        Copy channel link
      </ActionButton>
      {(failed || preview === 'error') && (
        <p className="sc-copylink-fail">
          Couldn't copy. Copy the address bar instead: it ends in <span className="sc-copylink-hash">{hash}</span>.
        </p>
      )}
    </div>
  )
}

/** Phones that can hand a file to the share sheet get it there (Save image, or post); everyone else downloads. */
function canShareFiles(): boolean {
  try {
    const probe = new File([''], 'card.png', { type: 'image/png' })
    return matchMedia('(pointer: coarse)').matches && Boolean(navigator.canShare?.({ files: [probe] }))
  } catch {
    return false
  }
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Saves the card as a 1080 × 1350 PNG. The image is drawn as soon as the control mounts, so the share sheet opens
 * inside the tap (Safari refuses a share that follows slow work). Key it by the card so a new card draws anew.
 */
export function SaveCard({
  spec,
  filename,
  preview,
}: {
  spec: ChannelImageSpec
  /** "signalcon-2027-ch28-mireille-okonkwo-hayashi.png" */
  filename: string
  preview?: Extract<ActionPreview, 'idle' | 'pending' | 'success' | 'error'>
}): JSX.Element {
  const [share, setShare] = useState(canShareFiles)
  const [failed, setFailed] = useState(false)
  const image = useRef<Promise<Blob> | null>(null)
  // drawn once per control: the spec belongs to one card (the parent keys this control by the card)
  const draw = useCallback((): Promise<Blob> => {
    image.current ??= import('./channel-image').then((m) => m.renderChannelCard(spec))
    // a failed drawing is retried on the next press
    image.current.catch(() => (image.current = null))
    return image.current
  }, [spec])
  // start drawing when the browser is idle
  useEffect(() => {
    if (preview) return
    const early = (): void => void draw().catch(() => {})
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(early)
      return () => window.cancelIdleCallback(id)
    }
    const id = globalThis.setTimeout(early, 300)
    return () => globalThis.clearTimeout(id)
  }, [preview, draw])

  return (
    <div className="sc-savecard">
      <ActionButton
        variant="secondary"
        preview={preview}
        timeoutMs={0}
        onAction={async () => {
          setFailed(false)
          const blob = await draw()
          if (share) {
            try {
              await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })], title: `${spec.name} · SIGNAL//CON 2027` })
              return
            } catch (error) {
              // closed by the person: the button rests; refused by the browser: save it instead
              if (!(error instanceof DOMException) || error.name !== 'NotAllowedError') throw error
              setShare(false)
            }
          }
          download(blob, filename)
        }}
        pendingLabel="Drawing the card…"
        successLabel={share ? 'Card shared' : 'Card saved'}
        successMessage={share ? `${spec.name}'s card shared` : `${spec.name}'s card saved as ${filename}`}
        errorMessage={() => "Couldn't make the card image. A screenshot of the card works too."}
        onError={() => setFailed(true)}
      >
        {share ? 'Share card image' : 'Save card image'}
      </ActionButton>
      {(failed || preview === 'error') && (
        <p className="sc-copylink-fail">Couldn't make the card image. A screenshot of the card works too.</p>
      )}
    </div>
  )
}
