/**
 * HALO (`halo-landing`): one titanium training watch on a still studio stage, turned, taken apart, worn and built;
 * the thread is the halo ring on its face, open in the hero and closed around "Pre-ordered" (CONCEPT.md).
 * Built on the project's system (`src/system/`): this page composes its components and tokens and adds only the story
 * canvas, the step story and the page's own layout. Copy comes from UX.md; every action and wait is built from its
 * inventory; motion follows MOTION.md row by row.
 */
import '@fontsource-variable/host-grotesk'
import { lazy, Suspense, type RefObject, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import '@/system/tokens.css'
import { announce, LiveRegion, ToastRegion } from '@/system/feedback'
import { DEFAULT_BUILD, deliveryOf, euro, Footer, Header, OrderBar, priceOf, type Build, type PriceState } from '@/system/halo'
import { isAbort, parseLatency, simulate, type LatencyId } from '@/system/latency'
import { prefersReducedMotion, subscribeReducedMotion } from '@/system/motion'
import './tokens.css'
import './page.css'
import { Bands } from './sections/Bands'
import { Design } from './sections/Design'
import { Hero } from './sections/Hero'
import { Loader } from './sections/Loader'
import { Order } from './sections/Order'
import { Preorder } from './sections/Preorder'
import { Specs } from './sections/Specs'
import { StepStory, type Step } from './sections/StepStory'
import { story } from './story'

gsap.registerPlugin(ScrollTrigger)

const StoryScene = lazy(() => import('./three/StoryScene'))

/** The tab title: product and outcome. */
const TITLE = 'HALO, a titanium training watch (design study)'

const DARK = '(prefers-color-scheme: dark)'

/** The page's links, in page order (UX.md Header and Footer). */
const LINKS = [
  { href: '#battery', label: 'Battery' },
  { href: '#training', label: 'Training' },
  { href: '#design', label: 'Design' },
  { href: '#specs', label: 'Specs' },
] as const

const TEARDOWN: readonly Step[] = [
  { title: 'Glass', body: 'Flat sapphire crystal over the display.' },
  { title: 'Display', body: 'Always on inside the halo ring, up to 3000 nits outdoors.' },
  { title: 'Sensors', body: 'Dual-band GNSS on L1 and L5, and optical heart rate across five zones.' },
  {
    title: 'Battery',
    body: (
      <>
        Up to <span className="accent-figure">14 days</span> of everyday use and up to 40 hours of dual-band GPS training. 0 to 80% in 45 minutes.
      </>
    ),
  },
  { title: 'Case', body: 'Grade 5 titanium, bead-blasted flanks and a brushed top: 41 g at 41 mm, 47 g at 45 mm, without the band.' },
]

const MOMENTS: readonly Step[] = [
  { title: 'The run', body: 'Your heart line draws as you go: 168 bpm, Z4 Threshold and 4:12 /km in one look.' },
  { title: 'The night', body: 'In the evening the face dims to a low red. In the morning it shows your night: 7 h 12 min.' },
  { title: 'The pool', body: 'Water resistant to 100 m. The face shows your split per 100 m, 1:41, and your laps.' },
  { title: 'The message', body: 'A message from your coach arrives mid-session, on the face.' },
]

/** Mirror the page's ground and colour scheme onto the document and the theme-color meta, so overscroll, the
 *  window scrollbar and the browser chrome follow the tokens in both themes. Restored when the page unmounts. */
function useDocumentSurfaces(root: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    const before = { title: document.title, bg: html.style.backgroundColor, scheme: html.style.colorScheme }
    const existing = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const meta = existing ?? document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }))
    const metaBefore = meta.content
    const sync = (): void => {
      const style = getComputedStyle(el)
      const bg = style.getPropertyValue('--bg').trim()
      html.style.backgroundColor = bg
      html.style.colorScheme = style.getPropertyValue('color-scheme')
      meta.content = bg
    }
    document.title = TITLE
    sync()
    const dark = window.matchMedia(DARK)
    dark.addEventListener('change', sync)
    const observer = new MutationObserver(sync)
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      dark.removeEventListener('change', sync)
      observer.disconnect()
      document.title = before.title
      html.style.backgroundColor = before.bg
      html.style.colorScheme = before.scheme
      if (existing) meta.content = metaBefore
      else meta.remove()
    }
  }, [root])
}

// Optional on purpose: the proof views stay local, and a checkout without ./proof builds the page alone.
const proof = import.meta.glob<{ default: React.ComponentType }>('./proof/*.tsx')
const proofView = (name: string): React.LazyExoticComponent<React.ComponentType> | null => {
  const load = proof[`./proof/${name}.tsx`]
  return load ? lazy(load) : null
}
/** Look development for the 3D watch (proof only): /p/halo-landing?lookdev=1 */
const Lookdev = proofView('Lookdev')
/** The hero-sprint comps (proof only): /p/halo-landing?comp=a|b|c */
const Comps = proofView('Comps')

export default function Page(): React.JSX.Element {
  if (Comps && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('comp')) {
    return (
      <Suspense fallback={null}>
        <Comps />
      </Suspense>
    )
  }
  if (Lookdev && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('lookdev')) {
    return (
      <Suspense fallback={null}>
        <Lookdev />
      </Suspense>
    )
  }
  return <Landing />
}

function hasWebGL(): boolean {
  if (new URLSearchParams(window.location.search).has('nowebgl')) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Poster capture (`?poster=hero|view-1..3|tear-1..5|moment-1..4`): the story frozen at one step, the copy hidden,
 * so each still is the same frame as its live scene (MOTION.md Render budget, posters).
 */
function freezeFor(poster: string | null): 'black' | 'paper' | null {
  if (!poster) return null
  const [kind, n] = poster.split('-')
  const k = Number(n) || 0
  story.paused = true
  if (kind === 'view') story.yawTarget = -k * (Math.PI / 2)
  if (kind === 'tear') Object.assign(story, { enter2: 1, tear: k - 0.0001 })
  if (kind === 'moment') Object.assign(story, { enter2: 1, tear: 5, enter3: 1, moment: k - 0.001 })
  return kind === 'tear' ? 'paper' : 'black'
}

function Landing(): React.JSX.Element {
  const root = useRef<HTMLDivElement>(null)
  const [poster] = useState(() => new URLSearchParams(window.location.search).get('poster'))
  const [frozenStage] = useState(() => freezeFor(poster))
  useDocumentSurfaces(root)
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true)
  const [live] = useState(hasWebGL)
  const [ready, setReady] = useState(false)
  const [mount, setMount] = useState(false)
  const [storyVisible, setStoryVisible] = useState(true)
  const [stage, setStage] = useState<'black' | 'paper'>(frozenStage ?? 'black')
  const [still, setStill] = useState('hero')
  const [build, setBuild] = useState<Build>(DEFAULT_BUILD)
  const [price, setPrice] = useState<PriceState>('ready')
  const [delivery, setDelivery] = useState(deliveryOf(DEFAULT_BUILD))
  const [sheet, setSheet] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [heroCta, setHeroCta] = useState(true)
  const [endInView, setEndInView] = useState(false)
  const [designActionInView, setDesignActionInView] = useState(false)
  const cta = useRef<HTMLButtonElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const preorderRef = useRef<HTMLDivElement>(null)
  const estimateCtl = useRef<AbortController | null>(null)
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const latency: LatencyId | null = parseLatency(params.get('latency'))
  // one stable pixel-ratio range: a new array on each render would make the canvas re-allocate its buffer. The story
  // canvas fills the window, so it stops at 1.5x (1.25x on touch screens): sharp, and a third of the 2x pixel cost
  const [dpr] = useState<[number, number]>(() => (window.matchMedia('(pointer: coarse)').matches ? [1, 1.25] : [1, 1.5]))

  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  useEffect(() => {
    story.reduced = reduced
  }, [reduced])

  // the loading screen (A0, the person's choice): the 3D starts at once and the page opens when the watch is ready,
  // so nothing loads, compiles or uploads once the visitor scrolls. "Show the page now" and a 10 s limit open it early;
  // the poster then holds the frame until the watch arrives. No loading screen without WebGL or in poster capture.
  const [progress, setProgress] = useState(0.06)
  const [skipped, setSkipped] = useState(false)
  const loading = live && !poster && !ready && !skipped
  // the shell painted the black stage before this page's code arrived (index.html); the page's own stages take over
  useEffect(() => {
    document.documentElement.style.background = ''
  }, [])
  useEffect(() => {
    if (!live) return
    setMount(true)
    setProgress((p) => Math.max(p, 0.15))
  }, [live])
  useEffect(() => {
    if (!loading) return
    const limit = window.setTimeout(() => setSkipped(true), 10000)
    // hold the page still while it loads: no scroll, no keys reaching the story
    const html = document.documentElement
    const before = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(limit)
      html.style.overflow = before
    }
  }, [loading])

  // smooth scroll for the story (MOTION.md), off under reduced motion; ScrollTrigger follows it
  useEffect(() => {
    if (reduced || poster || loading) return
    const lenis = new Lenis({ anchors: true, lerp: 0.12 })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number): void => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [reduced, poster, loading])

  // an in-page link moves focus to its section's heading once the scroll lands (A6, A7), so keyboard and screen
  // reader users arrive where they were sent
  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
      const id = link?.getAttribute('href')?.slice(1)
      const target = id ? document.getElementById(id) : null
      if (!target) return
      const heading = target.querySelector<HTMLElement>('h1, h2, h3') ?? target
      window.setTimeout(() => {
        heading.tabIndex = -1
        heading.focus({ preventScroll: true })
      }, reduced ? 0 : 900)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [reduced])

  // the story canvas renders only while its stretch of the page is on screen
  useEffect(() => {
    const el = storyRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStoryVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // the header's action stays secondary while the hero's button shows; the order bar shows between the hero and S7
  useEffect(() => {
    const a = cta.current
    const b = preorderRef.current
    if (!a || !b) return
    const io1 = new IntersectionObserver(([e]) => setHeroCta(e.isIntersecting))
    const io2 = new IntersectionObserver(([e]) => setEndInView(e.isIntersecting))
    // the bar also steps aside through the whole configurator: its panel has its own price, Pre-order and note, so a
    // second bar would only cover them (from the panel's top reaching the lower third to its end leaving the top)
    const io3 = new IntersectionObserver(([e]) => setDesignActionInView(e.isIntersecting), { rootMargin: '0px 0px -33% 0px' })
    io1.observe(a)
    io2.observe(b)
    const designPanel = document.getElementById('design')
    if (designPanel) io3.observe(designPanel)
    return () => {
      io1.disconnect()
      io2.disconnect()
      io3.disconnect()
    }
  }, [])

  const estimate = useCallback(
    async (next: Build): Promise<void> => {
      estimateCtl.current?.abort()
      const own = new AbortController()
      estimateCtl.current = own
      setPrice('stale')
      try {
        const text = await simulate(latency ?? 'fast', deliveryOf(next), own.signal)
        setDelivery(text)
        setPrice('ready')
        announce(`${euro(priceOf(next))}. ${text}`)
      } catch (error) {
        if (!isAbort(error)) {
          setPrice('error')
          announce(`${euro(priceOf(next))}. Delivery estimate unavailable.`)
        }
      }
    },
    [latency],
  )

  function change(patch: Partial<Build>): void {
    const next = { ...build, ...patch }
    setBuild(next)
    story.build = next
    void estimate(next)
  }

  const openSheet = (): void => setSheet(true)

  return (
    <div ref={root} data-page="halo-landing" className="halo" data-stage="black" data-poster={poster || undefined}>
      <a href="#main" className="h-sr halo__skip">
        Skip to content
      </a>
      <div className="halo__header" data-stage={stage} inert={loading || undefined}>
        <Header links={LINKS} stage={stage} onPreorder={openSheet} actionVariant={heroCta ? 'secondary' : 'primary'} />
      </div>
      <main id="main" inert={loading || undefined}>
        <div ref={storyRef} className="story" data-stage={stage}>
          <div className="story__layer" aria-hidden="true">
            <picture className="story__poster" data-hidden={(live && ready) || still === 'design' || undefined}>
              <source media="(max-width: 63.99rem)" srcSet={`/halo-landing/${still}-390.webp`} />
              <img src={`/halo-landing/${still}-1440.webp`} alt="" width={1440} height={900} decoding="async" fetchPriority={still === 'hero' ? 'high' : 'auto'} />
            </picture>
            {mount ? (
              <Suspense fallback={null}>
                <StoryScene stage={stage} frameloop={storyVisible ? 'always' : 'never'} onReady={() => {
                  setProgress(1)
                  setReady(true)
                }} onProgress={(share) => setProgress((p) => Math.max(p, share))} dpr={dpr} />
              </Suspense>
            ) : null}
          </div>
          <Hero onPreorder={openSheet} ctaRef={cta} live={live && ready} reduced={reduced} onView={(v) => setStill(v === 0 ? 'hero' : `view-${v}`)} />
          <StepStory
            id="battery"
            story="teardown"
            title="Five layers, one job each."
            sub="Scroll to lift each layer off the case."
            steps={TEARDOWN}
            note="Figures are illustrative: HALO is a design study."
            reduced={reduced}
            onEnter={(v) => {
              story.enter2 = v
            }}
            onProgress={(v) => {
              story.tear = v
            }}
            onStage={(on) => setStage(on ? 'paper' : 'black')}
            onStep={(k) => !live && setStill(`tear-${k + 1}`)}
            frozen={!!poster}
          />
          <StepStory
            id="training"
            story="moments"
            title="Every session, on the face."
            sub="Four moments from one training day."
            steps={MOMENTS}
            note="Faces shown are illustrative."
            reduced={reduced}
            onEnter={(v) => {
              story.enter3 = v
            }}
            onProgress={(v) => {
              story.moment = v
            }}
            onStep={(k) => !live && setStill(`moment-${k + 1}`)}
            frozen={!!poster}
          />
          <Design
            build={build}
            onChange={change}
            price={price}
            delivery={delivery}
            onRetry={() => void estimate(build)}
            onPreorder={openSheet}
            live={live}
            reduced={reduced}
            onEnter={(v) => {
              story.enter4 = v
              // without WebGL the story's poster gives way to the section's own drawn watch
              if (!live) setStill((current) => (v > 0.5 ? 'design' : current === 'design' ? 'moment-4' : current))
            }}
          />
        </div>
        <Bands build={build} onChange={change} />
        <Specs />
        <div ref={preorderRef}>
          <Preorder build={build} price={price} delivery={delivery} onRetry={() => void estimate(build)} onPreorder={openSheet} placed={placed} latency={latency ?? 'slow'} />
        </div>
      </main>
      <Footer links={[...LINKS, { href: '#preorder', label: 'Pre-order' }]} signoff="Train by the ring." />
      <OrderBar build={build} shown={!heroCta && !endInView && !designActionInView && !sheet} onOrder={openSheet} priceState={price} />
      <Order open={sheet} onClose={() => setSheet(false)} build={build} delivery={delivery} latency={latency ?? 'slow'} onPlaced={(placed) => {
          setPlaced(placed)
          // the halo closes in every scene once the pre-order is placed, and opens again if it is cancelled
          story.ordered = placed
        }} />
      {live && !poster ? <Loader progress={progress} done={!loading} reduced={reduced} onSkip={() => setSkipped(true)} /> : null}
      <LiveRegion />
      <ToastRegion />
    </div>
  )
}
