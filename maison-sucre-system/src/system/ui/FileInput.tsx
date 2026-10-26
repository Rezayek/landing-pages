import { useEffect, useId, useRef, useState, type JSX } from 'react'
import { CheckIcon, CloseIcon, UploadIcon } from '../feedback/icons'
import { InlineMessage, ProgressBar, announce } from '../feedback'
import { simulate, isAbort, type LatencyId } from '../latency'
import { IconButton } from './Button'

export interface UploadFile {
  id: string
  name: string
  sizeMb: number
}

type Row = UploadFile & { state: 'uploading' | 'done' | 'failed' | 'rejected'; progress: number; reason?: string }

export interface FileInputProps {
  label: string
  /** Sample limits (CONTENT.md, *sample*). */
  maxFiles?: number
  maxMb?: number
  latency: LatencyId
  /** Files to add when the person presses "Choose pictures" in the playground (no real file system access). */
  pick: () => UploadFile[]
  onChange?: (done: UploadFile[]) => void
}

const ACCEPTED = /\.(jpe?g|png|heic)$/i

/**
 * Up to five inspiration pictures (COMPONENTS.md §File input). Each file gets a ProgressBar with Cancel while it
 * uploads, then a thumbnail chip with Remove (the chip settles in, its tick is piped: MOTION-SYSTEM.md, background
 * job). The button always works: dragging is never the only way. The playground simulates the upload with
 * `latency.ts`; nothing leaves the browser.
 */
export function FileInput({ label, maxFiles = 5, maxMb = 10, latency, pick, onChange }: FileInputProps): JSX.Element {
  const id = useId()
  const [rows, setRows] = useState<Row[]>([])
  const jobs = useRef(new Map<string, AbortController>())
  useEffect(() => () => jobs.current.forEach((c) => c.abort()), [])
  const live = rows.filter((r) => r.state !== 'rejected')
  const full = live.length >= maxFiles

  useEffect(() => {
    onChange?.(rows.filter((r) => r.state === 'done'))
  }, [rows, onChange])

  const update = (fileId: string, patch: Partial<Row>): void =>
    setRows((all) => all.map((r) => (r.id === fileId ? { ...r, ...patch } : r)))

  async function upload(file: UploadFile): Promise<void> {
    const controller = new AbortController()
    jobs.current.set(file.id, controller)
    try {
      for (const p of [20, 45, 70, 90]) {
        await simulate(latency === 'fail' ? 'slow' : latency, null, controller.signal).catch((e) => {
          throw e
        })
        update(file.id, { progress: p })
        if (latency === 'fail' && p >= 45) throw new Error('failed')
      }
      update(file.id, { progress: 100, state: 'done' })
    } catch (error) {
      if (isAbort(error)) return
      update(file.id, { state: 'failed', reason: `${file.name} did not upload. Try again.` })
    } finally {
      jobs.current.delete(file.id)
    }
  }

  function choose(): void {
    const room = maxFiles - live.length
    const picked = pick().slice(0, Math.max(0, room))
    const next: Row[] = picked.map((f) => {
      if (!ACCEPTED.test(f.name)) return { ...f, state: 'rejected', progress: 0, reason: `${f.name} is not a picture. Choose a JPEG, PNG or HEIC.` }
      if (f.sizeMb > maxMb) return { ...f, state: 'rejected', progress: 0, reason: `${f.name} is over ${maxMb} MB. Choose a smaller picture.` }
      return { ...f, state: 'uploading', progress: 0 }
    })
    setRows((all) => [...all, ...next])
    const uploading = next.filter((r) => r.state === 'uploading')
    if (uploading.length) announce(`Uploading ${uploading.length === 1 ? '1 picture' : `${uploading.length} pictures`}`)
    uploading.forEach((f) => void upload(f))
  }

  function remove(fileId: string): void {
    jobs.current.get(fileId)?.abort()
    setRows((all) => all.filter((r) => r.id !== fileId))
  }

  return (
    <div className="ms-file">
      <span className="ms-field__label" id={`${id}-label`}>
        {label} <span className="ms-field__optional">(optional)</span>
      </span>
      <div className="ms-file__zone">
        <UploadIcon />
        <span id={`${id}-limits`}>Up to {maxFiles} pictures, {maxMb} MB each: JPEG, PNG or HEIC (sample limits)</span>
        <button
          type="button"
          className="ms-btn"
          data-variant="secondary"
          aria-describedby={`${id}-label ${id}-limits`}
          aria-disabled={full || undefined}
          aria-description={full ? `${maxFiles === 5 ? 'Five' : maxFiles} pictures is the most` : undefined}
          onClick={() => (full ? undefined : choose())}
        >
          Choose pictures
        </button>
        {full ? <span>Five pictures is the most</span> : null}
      </div>
      {rows.length ? (
        <ul className="ms-file__list">
          {rows.map((row) => (
            <li key={row.id} className="ms-file__item">
              {row.state === 'uploading' ? (
                <ProgressBar
                  value={row.progress}
                  label={`Uploading ${row.name}`}
                  detail={`${row.progress}%`}
                  onCancel={() => remove(row.id)}
                  completeMessage={`${row.name} added`}
                />
              ) : row.state === 'done' ? (
                <span className="ms-file__chip">
                  <span data-vfx-play="pipe" style={{ display: 'inline-flex' }}>
                    <CheckIcon />
                  </span>
                  <span className="ms-file__name">{row.name}</span>
                  <IconButton label={`Remove ${row.name}`} icon={<CloseIcon />} onClick={() => remove(row.id)} />
                </span>
              ) : (
                <InlineMessage
                  tone="error"
                  action={
                    row.state === 'failed' ? (
                      <button
                        type="button"
                        className="ms-btn"
                        data-variant="quiet"
                        onClick={() => {
                          update(row.id, { state: 'uploading', progress: 0, reason: undefined })
                          void upload(row)
                        }}
                      >
                        Try again
                      </button>
                    ) : undefined
                  }
                  onDismiss={() => remove(row.id)}
                  dismissLabel={`Remove ${row.name}`}
                  announceText={row.reason}
                >
                  {row.reason}
                </InlineMessage>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
