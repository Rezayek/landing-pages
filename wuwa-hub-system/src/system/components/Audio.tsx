/**
 * Audio: the voice-line player and the music player on the Resonator page, and the UI sounds.
 *
 * No game audio is shipped. The sample clips are generated in the browser (soft tones, labelled "sample"), so the
 * players can be tuned through every state; the real app passes real file URLs. UI sounds are our own, synthesized
 * with WebAudio, OFF by default, with a switch and a volume in settings (stored as `ea-sound`).
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore, type JSX } from 'react'
import { WavePath } from '../feedback/Spinner'
import { Icon } from './icons'
import { Segmented } from './Button'
import { Slider, Switch } from './Choice'

/* --- Sample clips ------------------------------------------------------------------------------------------ */

const clipCache = new Map<string, string>()

/** A short generated WAV (mono, 22 kHz): two soft sine partials with an envelope. Returns a blob URL. */
export function sampleClip(seed: number, seconds = 3): string {
  const key = `${seed}:${seconds}`
  const cached = clipCache.get(key)
  if (cached) return cached
  const rate = 22050
  const n = Math.floor(rate * seconds)
  const data = new DataView(new ArrayBuffer(44 + n * 2))
  const text = (o: number, s: string): void => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  data.setUint32(4, 36 + n * 2, true)
  text(8, 'WAVEfmt ')
  data.setUint32(16, 16, true)
  data.setUint16(20, 1, true)
  data.setUint16(22, 1, true)
  data.setUint32(24, rate, true)
  data.setUint32(28, rate * 2, true)
  data.setUint16(32, 2, true)
  data.setUint16(34, 16, true)
  text(36, 'data')
  data.setUint32(40, n * 2, true)
  const base = 196 * 2 ** ((seed % 7) / 12)
  for (let i = 0; i < n; i++) {
    const t = i / rate
    const env = Math.min(1, t * 8) * Math.min(1, (seconds - t) * 3)
    const v = (Math.sin(2 * Math.PI * base * t) * 0.6 + Math.sin(2 * Math.PI * base * 1.5 * t) * 0.25) * env * 0.35
    data.setInt16(44 + i * 2, Math.round(v * 32767), true)
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'audio/wav' }))
  clipCache.set(key, url)
  return url
}

/* --- One player at a time --------------------------------------------------------------------------------- */

let playing: HTMLAudioElement | null = null
function claim(el: HTMLAudioElement): void {
  if (playing && playing !== el) playing.pause()
  playing = el
}

const fmt = (s: number): string => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00')

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

/**
 * Audio player: play or pause (44 px), a seek slider (arrow keys, a click on the track), elapsed and total time, the
 * waveform tuning while it plays and flat when paused, an error line with Try again. Loading shows after the
 * indicator delay. One player sounds at a time. `compact` is the voice-line row form.
 */
export function AudioPlayer({
  src,
  title,
  subtitle,
  compact = false,
  onState,
}: {
  src: string
  title: string
  subtitle?: string
  compact?: boolean
  onState?: (state: AudioState) => void
}): JSX.Element {
  const ref = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<AudioState>('idle')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showLoading, setShowLoading] = useState(false)
  const seekId = useId()
  // No preload until the player is near the screen, so a page of players costs nothing until scrolled to.
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '400px 0px' })
    io.observe(el.parentElement ?? el)
    return () => io.disconnect()
  }, [near])
  useEffect(() => onState?.(state), [state, onState])
  useEffect(() => {
    if (state !== 'loading') {
      setShowLoading(false)
      return
    }
    const timer = window.setTimeout(() => setShowLoading(true), 400)
    return () => window.clearTimeout(timer)
  }, [state])

  function toggle(): void {
    const el = ref.current
    if (!el) return
    if (state === 'playing') {
      el.pause()
      return
    }
    claim(el)
    setState('loading')
    el.play().catch(() => setState('error'))
  }
  function retry(): void {
    const el = ref.current
    if (!el) return
    el.load()
    setState('idle')
  }

  const label = state === 'playing' ? `Pause ${title}` : `Play ${title}`
  return (
    <div className="ea-audio ea-frame" data-tone="outline" data-compact={compact || undefined} data-state={state}>
      <audio
        ref={ref}
        src={src}
        preload={near ? 'metadata' : 'none'}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlaying={() => setState('playing')}
        onPause={(e) => setState(e.currentTarget.ended ? 'ended' : 'paused')}
        onEnded={() => setState('ended')}
        onWaiting={() => setState('loading')}
        onError={() => setState('error')}
      />
      <button type="button" className="ea-audio__play ea-btn ea-frame ea-edge" data-variant="primary" data-icon-only="" aria-label={label} onClick={toggle} disabled={state === 'error'}>
        <Icon name={state === 'playing' ? 'pause' : 'play'} size="md" />
      </button>
      <div className="ea-audio__body">
        <div className="ea-audio__head">
          <span className="ea-audio__title">{title}</span>
          {subtitle ? <span className="ea-audio__sub">{subtitle}</span> : null}
          <span className="ea-wave ea-audio__wave" data-settle={state !== 'playing' || undefined} aria-hidden="true">
            <WavePath />
          </span>
        </div>
        {state === 'error' ? (
          <span className="ea-fld__msg" data-tone="error" role="alert">
            <Icon name="error" />
            Couldn't play this clip.
            <button type="button" className="ea-link" data-standalone="" style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit' }} onClick={retry}>
              Try again
            </button>
          </span>
        ) : (
          <div className="ea-audio__seek">
            <label htmlFor={seekId} className="ea-sr-only">
              Position in {title}
            </label>
            <input
              id={seekId}
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={0.1}
              value={time}
              aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
              onChange={(e) => {
                const el = ref.current
                if (el) el.currentTime = Number(e.target.value)
              }}
            />
            <span className="ea-audio__time" data-numeric="">
              {showLoading ? 'Loading…' : `${fmt(time)} / ${fmt(duration)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export interface VoiceLine {
  readonly id: string
  readonly title: string
  readonly transcript: string
}

/**
 * Voice lines (Resonator page, like the in-game Profile > Voice list): a language switch, then one row per line with
 * its player and transcript. The transcript is always shown, so the content never depends on sound.
 */
export function VoiceLines({ lines, broken }: { lines: readonly VoiceLine[]; broken?: string }): JSX.Element {
  const [lang, setLang] = useState<'en' | 'jp' | 'cn' | 'kr'>('en')
  return (
    <div className="ea-voices">
      <div className="ea-voices__bar">
        <Segmented
          label="Voice language"
          value={lang}
          onChange={setLang}
          options={[
            { id: 'en', label: 'EN' },
            { id: 'jp', label: 'JP' },
            { id: 'cn', label: 'CN' },
            { id: 'kr', label: 'KR' },
          ]}
        />
        <span className="ea-voices__note">Sample clips (generated tones), not game audio.</span>
      </div>
      <ul className="ea-voices__list">
        {lines.map((line, i) => (
          <li key={line.id}>
            <AudioPlayer compact src={line.id === broken ? '/missing-clip.wav' : sampleClip(i + lang.length * 3, 2.5 + (i % 3))} title={line.title} subtitle={lang.toUpperCase()} />
            <p className="ea-voices__text">{line.transcript}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Music player: one track with the waveform as its visual; the same states as the voice-line player. */
export function MusicPlayer({ title, subtitle }: { title: string; subtitle: string }): JSX.Element {
  return <AudioPlayer src={sampleClip(11, 8)} title={title} subtitle={subtitle} />
}

/* --- UI sounds ------------------------------------------------------------------------------------------- */

export type UiSoundName = 'press' | 'success' | 'error' | 'open'

interface SoundSettings {
  readonly on: boolean
  readonly volume: number
}

function readSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem('ea-sound')
    if (raw) return { on: false, volume: 40, ...(JSON.parse(raw) as Partial<SoundSettings>) }
  } catch {
    /* storage blocked */
  }
  return { on: false, volume: 40 }
}

let settings: SoundSettings = typeof window === 'undefined' ? { on: false, volume: 40 } : readSettings()
const listeners = new Set<() => void>()
let ctx: AudioContext | null = null

function setSettings(next: SoundSettings): void {
  settings = next
  try {
    localStorage.setItem('ea-sound', JSON.stringify(next))
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l())
}

/**
 * Plays a short synthesized UI sound when sound is on: press (a soft tick), success (a rising two-note chime),
 * error (a low falling pair), open (a light swell). Never the only cue: the visual state always changes too.
 */
export function uiSound(name: UiSoundName): void {
  if (!settings.on || typeof window === 'undefined') return
  try {
    ctx ??= new AudioContext()
    const notes: Record<UiSoundName, readonly [number, number][]> = {
      press: [[880, 0.04]],
      success: [
        [660, 0.09],
        [990, 0.14],
      ],
      error: [
        [330, 0.1],
        [247, 0.16],
      ],
      open: [[520, 0.12]],
    }
    let at = ctx.currentTime
    for (const [freq, len] of notes[name]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime((settings.volume / 100) * 0.18, at + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + len)
      osc.connect(gain).connect(ctx.destination)
      osc.start(at)
      osc.stop(at + len + 0.02)
      at += len * 0.8
    }
  } catch {
    /* audio unavailable: sound is never the only cue */
  }
}

function useSoundSettings(): SoundSettings {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => settings,
    () => settings,
  )
}

/** Sound settings: the on/off switch (off by default), the volume, and a Test button. */
export function SoundSettingsPanel(): JSX.Element {
  const s = useSoundSettings()
  return (
    <div className="ea-sound">
      <Switch label="Interface sounds" checked={s.on} onChange={(on) => setSettings({ ...s, on })} />
      {s.on ? (
        <>
          <Slider label="Volume" value={s.volume} min={0} max={100} onChange={(volume) => setSettings({ ...s, volume })} />
          <div className="sys-row-wrap">
            {(['press', 'success', 'error', 'open'] as const).map((n) => (
              <button key={n} type="button" className="ea-btn ea-frame ea-edge" data-variant="secondary" onClick={() => uiSound(n)}>
                Play “{n}”
              </button>
            ))}
          </div>
        </>
      ) : (
        <span className="ea-fld__hint">Off by default. Every sound also has a visual cue.</span>
      )}
    </div>
  )
}
