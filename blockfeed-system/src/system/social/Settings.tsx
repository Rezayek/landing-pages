import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react'
import { InlineMessage, announce } from '../feedback'
import { Button, Icon, Panel, RadioGroup, Segmented, Select, Toggle } from '../ui'
import { setAppearance, useAppearance, type Contrast, type Motion, type Scale, type Theme } from './appearance'
import type { Preferences } from './logic'
import './social.css'

export interface SettingsPanelProps {
  readonly saved: Preferences
  readonly onSave: (next: Preferences, signal: AbortSignal) => Promise<unknown>
  readonly onSaved?: (next: Preferences) => void
}

type Section = 'notify' | 'privacy'
type SaveState = { readonly section: Section; readonly phase: 'saving' | 'saved' | 'failed' } | null

const HOLD_SAVED_MS = 1500

/**
 * Settings, like the game's options screen: every change saves on its own, there is no Save button. Appearance is
 * local and applies at once. Notification and privacy changes are sent as they happen: the section heading says
 * "Saving…", then "Saved" for a moment; a failure puts the control back and says why under that section, with Try
 * again. Each section is a named group, not a page landmark.
 */
export function SettingsPanel({ saved, onSave, onSaved }: SettingsPanelProps): JSX.Element {
  const look = useAppearance()
  const [prefs, setPrefs] = useState<Preferences>(saved)
  const [state, setState] = useState<SaveState>(null)
  const confirmed = useRef<Preferences>(saved)
  const pending = useRef<{ section: Section; next: Preferences } | null>(null)
  const controller = useRef<AbortController | null>(null)
  const hold = useRef<number | undefined>(undefined)
  useEffect(
    () => () => {
      controller.current?.abort()
      window.clearTimeout(hold.current)
    },
    [],
  )

  async function save(section: Section, next: Preferences): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    pending.current = { section, next }
    window.clearTimeout(hold.current)
    setState({ section, phase: 'saving' })
    try {
      await onSave(next, own.signal)
      confirmed.current = next
      onSaved?.(next)
      setState({ section, phase: 'saved' })
      hold.current = window.setTimeout(() => setState(null), HOLD_SAVED_MS)
    } catch {
      if (own.signal.aborted) return
      setPrefs(confirmed.current)
      setState({ section, phase: 'failed' })
      announce('Could not save this setting. It is back to how it was.')
    }
  }

  const set = <K extends keyof Preferences>(section: Section, key: K, v: Preferences[K]): void => {
    const next = { ...prefs, [key]: v }
    setPrefs(next)
    void save(section, next)
  }

  const status = (section: Section): JSX.Element | null => {
    if (state?.section !== section) return null
    if (state.phase === 'saving') return <p className="bf-hint bf-saved">Saving…</p>
    if (state.phase === 'saved')
      return (
        <p className="bf-hint bf-saved" data-ok="">
          <Icon name="check" size="sm" /> Saved
        </p>
      )
    return (
      <InlineMessage
        tone="error"
        action={
          <Button size="sm" onClick={() => pending.current && void save(pending.current.section, pending.current.next)}>
            Try again
          </Button>
        }
      >
        Could not save this setting, so it is back to how it was.
      </InlineMessage>
    )
  }

  return (
    <div className="bf-stack" style={{ '--bf-gap': 'var(--space-4)' } as CSSProperties}>
      <Panel title="Appearance" role="group" aria-label="Appearance settings">
        <div className="bf-stack">
          <Segmented<Theme>
            label="Theme"
            value={look.theme}
            onChange={(theme) => setAppearance({ theme })}
            options={[
              { value: 'system', label: 'Match device' },
              { value: 'light', label: 'Stone' },
              { value: 'dark', label: 'Deepslate' },
            ]}
          />
          <Segmented<Scale>
            label="Interface size"
            value={look.scale}
            onChange={(scale) => setAppearance({ scale })}
            options={[
              { value: '2', label: 'Normal' },
              { value: '3', label: 'Large' },
            ]}
          />
          <Toggle label="More contrast" checked={look.contrast === 'more'} onChange={(on) => setAppearance({ contrast: (on ? 'more' : 'normal') as Contrast })} />
          <Toggle label="Reduce motion" checked={look.motion === 'reduced'} onChange={(on) => setAppearance({ motion: (on ? 'reduced' : 'full') as Motion })} />
          <p className="bf-hint">Appearance changes apply at once and are remembered on this device.</p>
        </div>
      </Panel>

      <Panel title="Notify me about" role="group" aria-label="Notification settings">
        <div className="bf-stack">
          {status('notify')}
          <Toggle label="Likes on my builds" checked={prefs.likes} onChange={(v) => set('notify', 'likes', v)} />
          <Toggle label="Comments and replies" checked={prefs.comments} onChange={(v) => set('notify', 'comments', v)} />
          <Toggle label="New followers" checked={prefs.followers} onChange={(v) => set('notify', 'followers', v)} />
          <Toggle label="Challenge reminders" checked={prefs.challenges} onChange={(v) => set('notify', 'challenges', v)} />
          <Toggle label="Event reminders" checked={prefs.events} onChange={(v) => set('notify', 'events', v)} />
          <Select
            label="Email summary"
            value={prefs.digest}
            onChange={(e) => set('notify', 'digest', e.target.value as Preferences['digest'])}
            options={[
              { value: 'never', label: 'Never' },
              { value: 'daily', label: 'Every day' },
              { value: 'weekly', label: 'Every week' },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Privacy" role="group" aria-label="Privacy settings">
        <div className="bf-stack">
          {status('privacy')}
          <RadioGroup<Preferences['messages']>
            legend="Who can send me messages"
            value={prefs.messages}
            onChange={(v) => set('privacy', 'messages', v)}
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'following', label: 'People I follow (recommended)' },
              { value: 'nobody', label: 'Nobody' },
            ]}
          />
          <Toggle label="Show when I am online" checked={prefs.showOnline} onChange={(v) => set('privacy', 'showOnline', v)} />
        </div>
      </Panel>
    </div>
  )
}
