import type { Server, ServerMode, ServerRegion } from './fixtures'

export interface ServerFilters {
  readonly query: string
  readonly version: string
  readonly mode: ServerMode | 'any'
  readonly region: ServerRegion | 'any'
  readonly minPlayers: 'any' | '10' | '100'
}

export const NO_FILTERS: ServerFilters = { query: '', version: 'any', mode: 'any', region: 'any', minPlayers: 'any' }

export function filterServers(servers: readonly Server[], f: ServerFilters): Server[] {
  const q = f.query.trim().toLowerCase()
  return servers.filter(
    (s) =>
      (!q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)) &&
      (f.version === 'any' || s.version === f.version) &&
      (f.mode === 'any' || s.mode === f.mode) &&
      (f.region === 'any' || s.region === f.region) &&
      (f.minPlayers === 'any' || s.online >= Number(f.minPlayers)),
  )
}

/** "2 days 14 hours left": hours rounded the way people say them. */
export function timeLeft(hours: number): string {
  if (hours <= 0) return 'Voting closed'
  if (hours < 1) return 'Less than an hour left'
  const d = Math.floor(hours / 24)
  const h = Math.round(hours % 24)
  if (d === 0) return `${h} ${h === 1 ? 'hour' : 'hours'} left`
  return `${d} ${d === 1 ? 'day' : 'days'}${h ? ` ${h} ${h === 1 ? 'hour' : 'hours'}` : ''} left`
}

export interface Preferences {
  readonly likes: boolean
  readonly comments: boolean
  readonly followers: boolean
  readonly challenges: boolean
  readonly events: boolean
  readonly digest: 'never' | 'daily' | 'weekly'
  readonly messages: 'everyone' | 'following' | 'nobody'
  readonly showOnline: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  likes: true,
  comments: true,
  followers: true,
  challenges: true,
  events: false,
  digest: 'weekly',
  messages: 'following',
  showOnline: true,
}
