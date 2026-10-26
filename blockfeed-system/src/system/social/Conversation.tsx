import { useId, useRef, useState, type FormEvent, type JSX } from 'react'
import { ActionButton, InlineMessage } from '../feedback'
import { Avatar, Button, Count, IconButton, Menu, Tag, TextArea } from '../ui'
import { playerById, ME, type CommentItem, type Message, type Thread } from './fixtures'
import { LikeButton } from './Build'
import './social.css'

export interface CommentProps {
  readonly item: CommentItem
  readonly liked?: boolean
  readonly onLike?: () => void
  readonly onReply?: () => void
  readonly onReport?: () => void
  readonly onOpenPlayer?: (id: string) => void
}

/** One comment: who, when, the words, a like and a reply. A reply is indented under what it answers. */
export function Comment({ item, liked = false, onLike, onReply, onReport, onOpenPlayer }: CommentProps): JSX.Element {
  const who = playerById(item.author)
  return (
    <article className="bf-comment" data-reply={item.reply ? '' : undefined} aria-label={`Comment by ${who.name}`}>
      <Avatar name={who.name} size="md" decorative />
      <div className="bf-comment__body">
        <div className="bf-row bf-comment__head">
          {onOpenPlayer ? (
            <button type="button" className="bf-link bf-comment__name" onClick={() => onOpenPlayer(who.id)}>
              {who.name}
            </button>
          ) : (
            <strong className="bf-comment__name">{who.name}</strong>
          )}
          {who.role ? <Tag tone={who.role === 'Moderator' ? 'info' : 'accent'}>{who.role}</Tag> : null}
          <span className="bf-subtle">{item.posted}</span>
        </div>
        <p className="bf-comment__text">{item.text}</p>
        <div className="bf-row">
          <LikeButton liked={liked} count={item.likes + (liked ? 1 : 0)} subject={`comment by ${who.name}`} onToggle={() => onLike?.()} />
          {item.reply ? null : (
            <Button size="sm" variant="ghost" icon="comment" onClick={onReply}>
              Reply
            </Button>
          )}
          <Menu label={`More about the comment by ${who.name}`} items={[{ id: 'report', label: 'Report comment', icon: 'flag', danger: true, onSelect: () => onReport?.() }]} />
        </div>
      </div>
    </article>
  )
}

export interface CommentComposerProps {
  /** the work: post it. It receives the text and an abort signal; a rejection is shown here and the text is kept. */
  readonly onSubmit: (text: string, signal: AbortSignal) => Promise<unknown>
  /** called after the success state has been shown */
  readonly onPosted?: (text: string) => void
  readonly label?: string
  readonly maxLength?: number
}

/**
 * Write a comment. The text stays on screen until the post has gone through; if it fails the person keeps every word
 * and sees the reason beside the button. The button is disabled with a reason while the box is empty.
 */
export function CommentComposer({ onSubmit, onPosted, label = 'Add a comment', maxLength = 300 }: CommentComposerProps): JSX.Element {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sent = useRef('')
  const clean = text.trim()
  return (
    <form className="bf-stack" onSubmit={(e: FormEvent) => e.preventDefault()}>
      <TextArea
        label={label}
        value={text}
        maxLength={maxLength}
        placeholder="Say something kind about the build"
        onChange={(e) => {
          setText(e.target.value)
          if (error) setError(null)
        }}
      />
      {error ? (
        <InlineMessage tone="error" title="Comment not posted" action={<span className="bf-muted">Your text is still here.</span>}>
          {error}
        </InlineMessage>
      ) : null}
      <div className="bf-row">
        <ActionButton
          variant="primary"
          type="submit"
          pendingLabel="Posting…"
          successLabel="Posted"
          disabled={clean.length === 0}
          disabledReason="Write a comment first"
          errorMessage={() => 'Your comment was not posted. Check your connection and try again.'}
          onAction={(signal) => {
            sent.current = clean
            setError(null)
            return onSubmit(clean, signal)
          }}
          onError={() => setError('The connection dropped before it reached the server. Press Post comment to try again.')}
          onDone={() => {
            onPosted?.(sent.current)
            setText('')
          }}
        >
          Post comment
        </ActionButton>
      </div>
    </form>
  )
}

/** The line height of the chat log: a time, a name, the words. Mine are marked with "You". */
export function ChatLine({ message, mine }: { message: Message; mine: boolean }): JSX.Element {
  const who = playerById(message.from)
  return (
    <p className="bf-chat__line" data-mine={mine ? '' : undefined}>
      <span className="bf-chat__time bf-num">{message.at}</span>
      <span className="bf-chat__name">{mine ? 'You' : who.name}</span>
      <span className="bf-chat__text">{message.text}</span>
    </p>
  )
}

/** The conversation as a chat log on the dark field, the way the game shows chat. It is a live log, read politely. */
export function ChatLog({ messages, label }: { messages: readonly Message[]; label: string }): JSX.Element {
  return (
    <div className="bf-chat" role="log" aria-label={label} tabIndex={0}>
      {messages.map((m, i) => (
        <ChatLine key={`${m.at}-${i}`} message={m} mine={m.from === ME.id} />
      ))}
    </div>
  )
}

export interface MessageComposerProps {
  readonly onSend: (text: string) => void
  readonly label: string
  readonly disabled?: boolean
}

/** One line and a send button. Enter sends; the field clears at once and the line appears in the log. */
export function MessageComposer({ onSend, label, disabled }: MessageComposerProps): JSX.Element {
  const [text, setText] = useState('')
  const id = useId()
  function send(e: FormEvent): void {
    e.preventDefault()
    const clean = text.trim()
    if (!clean || disabled) return
    onSend(clean)
    setText('')
  }
  return (
    <form className="bf-composer" onSubmit={send}>
      <label htmlFor={id} className="bf-sr">
        {label}
      </label>
      <input id={id} className="bf-input" value={text} placeholder="Write a message" maxLength={500} autoComplete="off" onChange={(e) => setText(e.target.value)} />
      <IconButton type="submit" icon="send" label="Send message" variant="primary" disabled={disabled || text.trim().length === 0} />
    </form>
  )
}

export interface ThreadListProps {
  readonly threads: readonly Thread[]
  readonly value: string
  readonly onChange: (id: string) => void
}

/** The inbox: one row per conversation, the open one marked, unread counts on the right. */
export function ThreadList({ threads, value, onChange }: ThreadListProps): JSX.Element {
  return (
    <nav aria-label="Conversations">
      <ul className="bf-threads">
        {threads.map((t) => {
          const who = playerById(t.with)
          const last = t.messages[t.messages.length - 1]
          return (
            <li key={t.id}>
              <button type="button" className="bf-thread" aria-current={t.id === value ? 'true' : undefined} onClick={() => onChange(t.id)}>
                <Avatar name={who.name} size="md" presence={who.presence} decorative />
                <span className="bf-thread__text">
                  <span className="bf-thread__name">
                    {who.name}
                    {t.unread ? <span className="bf-sr">, {t.unread} unread</span> : null}
                  </span>
                  <span className="bf-thread__last">{last.text}</span>
                </span>
                <span className="bf-thread__meta">
                  <span className="bf-subtle bf-num">{last.at}</span>
                  {t.unread ? <Count value={t.unread} /> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
