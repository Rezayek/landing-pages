import { useState, type JSX } from 'react'
import { ActionButton, InlineMessage } from '../feedback'
import { Button, Dialog, Panel, RadioGroup, Tag, TextArea } from '../ui'
import { playerById, type Report, type ReportReason } from './fixtures'
import './social.css'

const REASONS: readonly { value: ReportReason; label: string; hint: string }[] = [
  { value: 'Spam or scam', label: 'Spam or scam', hint: 'Ads, fake giveaways, links that ask for a login.' },
  { value: 'Harassment', label: 'Harassment', hint: 'Insults, threats or targeting a person.' },
  { value: 'Stolen build', label: 'Stolen build', hint: 'Posted as their own, but made by someone else.' },
  { value: 'Unsafe link', label: 'Unsafe link', hint: 'Leads to a download or a page that looks fake.' },
  { value: 'Something else', label: 'Something else', hint: 'Tell us in the box below.' },
]

export interface ReportDialogProps {
  readonly open: boolean
  readonly onClose: () => void
  /** what is being reported, in words: "the comment by HarborMoth" */
  readonly subject: string
  readonly onSubmit: (reason: ReportReason, details: string, signal: AbortSignal) => Promise<unknown>
  readonly onSent?: () => void
}

function ReportForm({ subject, onClose, onSubmit, onSent }: Omit<ReportDialogProps, 'open'>): JSX.Element {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [asked, setAsked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const missing = asked && reason === null
  return (
    <form className="bf-stack" onSubmit={(e) => e.preventDefault()}>
      <p className="bf-muted">Reports go to the moderators, who see the {subject}. The person is not told who reported.</p>
      <RadioGroup
        legend="Why are you reporting it?"
        value={reason ?? ('' as ReportReason)}
        onChange={(v) => {
          setReason(v)
          setError(null)
        }}
        options={REASONS}
        error={missing ? 'Choose a reason so the moderators know where to look.' : undefined}
      />
      <TextArea label="Anything else we should know?" optional value={details} maxLength={500} onChange={(e) => setDetails(e.target.value)} />
      {error ? (
        <InlineMessage tone="error" title="Report not sent">
          {error}
        </InlineMessage>
      ) : null}
      <div className="bf-dialog__actions">
        <Button onClick={onClose}>Cancel</Button>
        <ActionButton
          variant="primary"
          type="submit"
          pendingLabel="Sending…"
          successLabel="Report sent"
          errorLabel="Send report"
          onAction={(signal) => {
            if (reason === null) {
              setAsked(true)
              throw new DOMException('Choose a reason first.', 'ValidationError')
            }
            setError(null)
            return onSubmit(reason, details.trim(), signal)
          }}
          errorMessage={(e) => (e instanceof DOMException && e.name === 'ValidationError' ? 'Choose a reason first.' : 'The report was not sent. Check your connection and try again.')}
          onError={(e) => {
            if (!(e instanceof DOMException && e.name === 'ValidationError')) setError('The report did not go through. Your answers are still here: press Send report to try again.')
          }}
          onDone={() => {
            onSent?.()
            onClose()
          }}
        >
          Send report
        </ActionButton>
      </div>
    </form>
  )
}

/** Report something. One reason is required, details are optional, and the dialog keeps what was typed if sending fails. */
export function ReportDialog({ open, onClose, subject, onSubmit, onSent }: ReportDialogProps): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} title="Report to moderators">
      {open ? <ReportForm subject={subject} onClose={onClose} onSubmit={onSubmit} onSent={onSent} /> : null}
    </Dialog>
  )
}

export type QueueStatus = 'open' | 'hidden' | 'warned' | 'dismissed'
export type QueueAction = 'hide' | 'warn' | 'dismiss' | 'undo'

export interface QueueRowProps {
  readonly report: Report
  readonly status: QueueStatus
  readonly onAct: (action: QueueAction) => void
  readonly busy?: boolean
}

const STATUS_WORD: Record<Exclude<QueueStatus, 'open'>, string> = { hidden: 'Hidden', warned: 'Author warned', dismissed: 'Dismissed' }

/** One reported item in the moderation queue. The decision is a button; every decision except none has an Undo. */
export function QueueRow({ report, status, onAct, busy }: QueueRowProps): JSX.Element {
  const by = playerById(report.by)
  const open = status === 'open'
  return (
    <Panel as="article" flush className="bf-queue" aria-label={`${report.kind} reported for ${report.reason}`} aria-busy={busy || undefined}>
      <div className="bf-row">
        <Tag>{report.kind}</Tag>
        <Tag tone="warning" icon="flag">
          {report.reason}
        </Tag>
        {report.count > 1 ? <Tag tone="negative">{report.count} reports</Tag> : null}
        <span className="bf-subtle">{report.when}</span>
      </div>
      <p className="bf-muted">
        On <strong>{report.target}</strong>, reported by {by.name}
      </p>
      <blockquote className="bf-quote">{report.excerpt}</blockquote>
      {open ? (
        <div className="bf-row">
          <Button variant="danger" size="sm" icon="block" disabled={busy} onClick={() => onAct('hide')}>
            Hide
          </Button>
          <Button size="sm" icon="warn" disabled={busy} onClick={() => onAct('warn')}>
            Warn author
          </Button>
          <Button size="sm" variant="ghost" icon="cross" disabled={busy} onClick={() => onAct('dismiss')}>
            Dismiss
          </Button>
        </div>
      ) : (
        <div className="bf-row">
          <Tag tone={status === 'dismissed' ? 'neutral' : 'positive'} icon="check">
            {STATUS_WORD[status]}
          </Tag>
          <Button size="sm" variant="ghost" icon="arrowLeft" disabled={busy} onClick={() => onAct('undo')}>
            Undo
          </Button>
        </div>
      )}
    </Panel>
  )
}
