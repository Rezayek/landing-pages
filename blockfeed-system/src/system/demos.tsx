/**
 * Demos for the product components on /system: one per entry of PRODUCT_COMPONENTS in registry.ts, each showing the
 * states its row lists. The data is invented (social/fixtures.ts). SystemPage merges these with the feedback demos.
 */
import { useState, type ComponentType, type JSX } from 'react'
import type { LatencyId } from './latency'
import { simulate } from './latency'
import {
  Avatar,
  Button,
  Checkbox,
  Count,
  CycleButton,
  Dialog,
  Hotbar,
  Icon,
  IconButton,
  Level,
  Logo,
  Menu,
  Panel,
  Ping,
  RadioGroup,
  SearchField,
  Segmented,
  Select,
  Slider,
  Slot,
  SlotGrid,
  Tabs,
  Tag,
  TagButton,
  TextArea,
  TextField,
  TipGap,
  TipLine,
  TipName,
  Toggle,
  Tooltip,
  XpBar,
} from './ui'
import {
  Bell,
  BuildCard,
  BuildGrid,
  ChallengeCard,
  ChatLog,
  Comment,
  CommentComposer,
  CopyField,
  DEFAULT_PREFERENCES,
  EventCalendar,
  FollowButton,
  Gallery,
  GroupCard,
  MessageComposer,
  NO_FILTERS,
  NotificationList,
  PlayerRow,
  ProfileHeader,
  QueueRow,
  ReportDialog,
  ResultGroup,
  ServerFilterBar,
  ServerRow,
  SettingsPanel,
  ThreadList,
  filterServers,
  type QueueStatus,
  type ServerFilters,
} from './social'
import { BUILDS, COMMENTS, GROUPS, ME, NOTIFICATIONS, PLAYERS, REPORTS, SERVERS, THREADS } from './social/fixtures'
import { ICONS, type IconName } from './pixel/icons'

export interface DemoProps {
  latency: LatencyId
  autorun: boolean
}

const toggleIn = (list: readonly string[], id: string): string[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

function LogoDemo(): JSX.Element {
  return (
    <div className="bf-stack">
      <Logo />
      <p className="sys-note">The "stack" mark: three blocks, drawn in code on the unit grid. Not a game asset.</p>
    </div>
  )
}

function IconsDemo(): JSX.Element {
  const names = Object.keys(ICONS) as IconName[]
  return (
    <SlotGrid cols={8}>
      {names.map((n) => (
        <Slot key={n} label={n}>
          <Icon name={n} />
        </Slot>
      ))}
    </SlotGrid>
  )
}

function PanelDemo(): JSX.Element {
  return (
    <div className="bf-stack">
      <Panel title="Panel">A bevelled panel with the one-unit notch.</Panel>
      <Panel title="Raised panel" tone="raised" lift>
        Dialogs and menus: raised, with the hard shadow.
      </Panel>
    </div>
  )
}

function ButtonDemo(): JSX.Element {
  const [seg, setSeg] = useState('new')
  const [pressed, setPressed] = useState(false)
  return (
    <div className="bf-stack">
      <div className="bf-row">
        <Button>Secondary</Button>
        <Button variant="primary" icon="plus">
          Post build
        </Button>
        <Button variant="danger" icon="trash">
          Delete build
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="bf-row">
        <Button size="sm">Small</Button>
        <Button size="lg" variant="primary">
          Large
        </Button>
        <Button aria-pressed={pressed} onClick={() => setPressed((p) => !p)}>
          Toggle: {pressed ? 'on' : 'off'}
        </Button>
        <IconButton icon="gear" label="Settings" />
        <IconButton icon="bookmark" label="Save" pressed />
      </div>
      <Segmented
        label="Sort builds"
        value={seg}
        onChange={setSeg}
        options={[
          { value: 'new', label: 'New' },
          { value: 'top', label: 'Top' },
          { value: 'following', label: 'Following' },
        ]}
      />
    </div>
  )
}

function SlotDemo(): JSX.Element {
  const [nav, setNav] = useState('feed')
  return (
    <div className="bf-stack">
      <Hotbar
        value={nav}
        onChange={setNav}
        items={[
          { id: 'feed', label: 'Feed', icon: 'feed' },
          { id: 'servers', label: 'Servers', icon: 'server' },
          { id: 'challenge', label: 'Challenge', icon: 'trophy' },
          { id: 'events', label: 'Events', icon: 'calendar' },
          { id: 'inbox', label: 'Messages', icon: 'mail', badge: 3 },
        ]}
      />
      <SlotGrid cols={6}>
        {(['image', 'heart', 'star', 'seed', 'pin', 'trophy'] as const).map((n, i) => (
          <Slot key={n} count={i * 7} label={n}>
            <Icon name={n} />
          </Slot>
        ))}
      </SlotGrid>
    </div>
  )
}

function TooltipDemo(): JSX.Element {
  return (
    <div className="bf-row">
      <Tooltip
        content={
          <>
            <TipName tier="rare">Night Market Tower</TipName>
            <TipLine>1.21 · Survival</TipLine>
            <TipGap />
            <TipLine tone="good">842 likes</TipLine>
          </>
        }
      >
        <Button>Hover or focus me</Button>
      </Tooltip>
      <Tooltip content={<TipName tier="epic">Week 43 winner</TipName>}>
        <Slot label="Trophy">
          <Icon name="trophy" />
        </Slot>
      </Tooltip>
    </div>
  )
}

function TabsDemo(): JSX.Element {
  const [tab, setTab] = useState('builds')
  return (
    <Tabs
      label="Profile sections"
      value={tab}
      onChange={setTab}
      tabs={[
        { id: 'builds', label: 'Builds', icon: 'image' },
        { id: 'saved', label: 'Saved', count: 5 },
        { id: 'groups', label: 'Groups' },
      ]}
    >
      <p>Panel for {tab}.</p>
    </Tabs>
  )
}

function TagDemo(): JSX.Element {
  const [on, setOn] = useState(['survival'])
  return (
    <div className="bf-stack">
      <div className="bf-row">
        <Tag>medieval</Tag>
        <Tag tone="version">1.21</Tag>
        <Tag tone="positive" icon="check">
          Online
        </Tag>
        <Tag tone="negative" icon="cross">
          Down
        </Tag>
        <Tag tone="warning" icon="warn">
          Full
        </Tag>
        <Tag tone="info" icon="info">
          Realm
        </Tag>
        <Tag tone="accent">New</Tag>
      </div>
      <div className="bf-row">
        {['survival', 'creative', 'redstone'].map((t) => (
          <TagButton key={t} pressed={on.includes(t)} onClick={() => setOn((l) => toggleIn(l, t))}>
            {t}
          </TagButton>
        ))}
      </div>
      <div className="bf-row">
        <Count value={4} />
        <Count value={120} />
        <Count value={3} tone="quiet" />
        <Level value={42} />
        <Avatar name="pebblewren" presence="online" />
        <Avatar name="harbormoth" size="lg" presence="away" />
        <Ping ms={38} />
        <Ping ms={140} />
        <Ping ms={null} />
      </div>
    </div>
  )
}

function XpDemo(): JSX.Element {
  return (
    <div className="bf-stack">
      <XpBar value={340} max={500} label="Level 12: 340 of 500 XP" showLabel />
      <XpBar value={0} max={500} label="Level 12: 0 of 500 XP" showLabel />
      <XpBar value={0} max={1} label="Working" indeterminate />
    </div>
  )
}

function FieldsDemo(): JSX.Element {
  const [title, setTitle] = useState('Night Market Tower')
  const [about, setAbout] = useState('')
  return (
    <div className="bf-stack">
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} hint="What other builders see first." />
      <TextField label="Seed" error="Seeds are numbers or text. Remove the spaces." defaultValue="12 34" />
      <TextField label="Coordinates" optional placeholder="X 120, Y 64, Z -340" />
      <TextField label="Disabled" disabled defaultValue="Read only" />
      <SearchField placeholder="Search builds" />
      <TextArea label="About this build" value={about} onChange={(e) => setAbout(e.target.value)} maxLength={300} />
    </div>
  )
}

function ChoicesDemo(): JSX.Element {
  const [on, setOn] = useState(true)
  const [mode, setMode] = useState<'survival' | 'creative'>('survival')
  const [vol, setVol] = useState(40)
  const [rsvp, setRsvp] = useState<'going' | 'maybe' | 'no'>('maybe')
  return (
    <div className="bf-stack">
      <Select
        label="Version"
        options={[
          { value: '1.21', label: '1.21' },
          { value: '1.20.4', label: '1.20.4' },
        ]}
      />
      <Checkbox label="Show my coordinates" hint="Others can visit your build" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <Toggle label="Show when I'm online" checked={on} onChange={setOn} />
      <Slider label="Feed density" min={0} max={100} value={vol} onChange={setVol} format={(v) => `${v}%`} />
      <CycleButton
        label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'survival', label: 'Survival' },
          { value: 'creative', label: 'Creative' },
        ]}
      />
      <RadioGroup
        legend="Are you going?"
        value={rsvp}
        onChange={setRsvp}
        options={[
          { value: 'going', label: 'Going' },
          { value: 'maybe', label: 'Maybe' },
          { value: 'no', label: 'Not going' },
        ]}
      />
    </div>
  )
}

function OverlayDemo(): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="bf-row">
      <Button onClick={() => setOpen(true)}>Delete build…</Button>
      <Menu
        label="More"
        items={[
          { id: 'share', label: 'Copy link', icon: 'share', onSelect: () => {} },
          { id: 'report', label: 'Report', icon: 'flag', danger: true, onSelect: () => {} },
        ]}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete Night Market Tower?"
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Keep it</Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete build
            </Button>
          </>
        }
      >
        <p>Its screenshots, likes and comments go too. This cannot be undone.</p>
      </Dialog>
    </div>
  )
}

function BuildCardDemo(): JSX.Element {
  const [liked, setLiked] = useState<string[]>([BUILDS[1].id])
  const [saved, setSaved] = useState<string[]>([])
  return (
    <div className="bf-stack">
      <BuildGrid label="Latest builds">
        {BUILDS.slice(0, 2).map((b) => (
          <BuildCard
            key={b.id}
            build={b}
            liked={liked.includes(b.id)}
            saved={saved.includes(b.id)}
            onLike={() => setLiked((l) => toggleIn(l, b.id))}
            onSave={() => setSaved((l) => toggleIn(l, b.id))}
            onOpen={() => {}}
            onOpenPlayer={() => {}}
            onReport={() => {}}
          />
        ))}
      </BuildGrid>
      <CopyField label="Seed" value={BUILDS[0].seed} />
    </div>
  )
}

function CommentDemo({ latency }: DemoProps): JSX.Element {
  return (
    <div className="bf-stack">
      {COMMENTS.slice(0, 2).map((c) => (
        <Comment key={c.id} item={c} onOpenPlayer={() => {}} />
      ))}
      <CommentComposer onSubmit={(text, signal) => simulate(latency, text, signal)} />
    </div>
  )
}

function MessagesDemo(): JSX.Element {
  const [thread, setThread] = useState('t1')
  const [msgs, setMsgs] = useState(THREADS[0].messages)
  return (
    <div className="bf-stack">
      <ThreadList threads={THREADS} value={thread} onChange={setThread} />
      <ChatLog label={`Conversation with ${THREADS[0].with}`} messages={msgs} />
      <MessageComposer label={`Message ${THREADS[0].with}`} onSend={(text) => setMsgs((m) => [...m, { from: ME.id, at: 'now', text }])} />
    </div>
  )
}

function ProfileDemo(): JSX.Element {
  const [following, setFollowing] = useState(false)
  return (
    <div className="bf-stack">
      <ProfileHeader headingLevel={4} player={PLAYERS[0]} following={following} onToggleFollow={() => setFollowing((f) => !f)} />
      <Gallery label={`${PLAYERS[0].name}'s builds`} builds={BUILDS.slice(0, 5)} />
      <PlayerRow player={PLAYERS[2]} action={<FollowButton name={PLAYERS[2].name} following={false} onToggle={() => {}} size="sm" />} />
    </div>
  )
}

function NotificationsDemo(): JSX.Element {
  return (
    <div className="bf-stack">
      <div className="bf-row">
        <Bell count={3} />
        <Bell count={0} />
        <Bell count={120} pressed />
      </div>
      <NotificationList label="Notifications" items={NOTIFICATIONS} />
    </div>
  )
}

function ServersDemo(): JSX.Element {
  const [filters, setFilters] = useState<ServerFilters>(NO_FILTERS)
  const servers = filterServers(SERVERS, filters)
  return (
    <div className="bf-stack">
      <ServerFilterBar value={filters} onChange={setFilters} resultCount={servers.length} />
      {servers.slice(0, 3).map((s) => (
        <ServerRow key={s.id} server={s} />
      ))}
    </div>
  )
}

function GroupsDemo(): JSX.Element {
  const [joined, setJoined] = useState<string[]>(GROUPS.filter((g) => g.joined).map((g) => g.id))
  return (
    <div className="bf-stack">
      {GROUPS.map((g) => (
        <GroupCard key={g.id} group={g} joined={joined.includes(g.id)} onToggle={() => setJoined((l) => toggleIn(l, g.id))} />
      ))}
    </div>
  )
}

function ChallengeDemo(): JSX.Element {
  const [voted, setVoted] = useState<string[]>([])
  return <ChallengeCard voted={voted} onVote={(id) => setVoted((v) => toggleIn(v, id))} />
}

function EventsDemo(): JSX.Element {
  const [day, setDay] = useState(24)
  const [going, setGoing] = useState<string[]>([])
  return <EventCalendar selected={day} onSelect={setDay} going={going} onToggleGoing={(id) => setGoing((g) => toggleIn(g, id))} />
}

function ModerationDemo({ latency }: DemoProps): JSX.Element {
  const [status, setStatus] = useState<QueueStatus>('open')
  const [open, setOpen] = useState(false)
  return (
    <div className="bf-stack">
      <Button icon="flag" onClick={() => setOpen(true)}>
        Report a build
      </Button>
      {REPORTS.slice(0, 2).map((r, i) => (
        <QueueRow
          key={r.id}
          report={r}
          status={i === 0 ? status : 'hidden'}
          onAct={(a) => setStatus(a === 'undo' ? 'open' : a === 'hide' ? 'hidden' : a === 'warn' ? 'warned' : 'dismissed')}
        />
      ))}
      <ReportDialog open={open} onClose={() => setOpen(false)} subject={BUILDS[0].title} onSubmit={(_r, _d, signal) => simulate(latency, true, signal)} />
    </div>
  )
}

function SettingsDemo({ latency }: DemoProps): JSX.Element {
  return <SettingsPanel saved={DEFAULT_PREFERENCES} onSave={(next, signal) => simulate(latency, next, signal)} />
}

function ResultsDemo(): JSX.Element {
  return (
    <ResultGroup title="Builders" count={2}>
      {PLAYERS.slice(0, 2).map((p) => (
        <PlayerRow key={p.id} player={p} />
      ))}
    </ResultGroup>
  )
}

export const PRODUCT_DEMOS: Readonly<Record<string, ComponentType<DemoProps>>> = {
  logo: LogoDemo,
  icons: IconsDemo,
  panel: PanelDemo,
  button: ButtonDemo,
  slot: SlotDemo,
  tooltip: TooltipDemo,
  tabs: TabsDemo,
  tag: TagDemo,
  'xp-bar': XpDemo,
  fields: FieldsDemo,
  choices: ChoicesDemo,
  overlays: OverlayDemo,
  'build-card': BuildCardDemo,
  comment: CommentDemo,
  messages: MessagesDemo,
  profile: ProfileDemo,
  notifications: NotificationsDemo,
  servers: ServersDemo,
  groups: GroupsDemo,
  challenge: ChallengeDemo,
  events: EventsDemo,
  moderation: ModerationDemo,
  settings: SettingsDemo,
  results: ResultsDemo,
}
