/**
 * S1 Hero (UX.md): the kitchen table with this week's ledger lying on it, the headline and the form beside it. The
 * signature: approve Ivy's request and the ledger stamps the line and writes the new total (UX.md A3-A5). On a wide
 * screen without reduced motion the scene is a sticky stage: as you scroll, the copy leaves and the camera dives into
 * the ledger until it lies flat and close (MOTION.md "Hero dive"), the scene-into-product move of the reference set.
 */
import { type JSX, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ActionButton, announce } from '@/system/feedback'
import { Button, Ledger, formatPence, personById, type LedgerLine } from '@/system/ui'
import { distance, durationMs, ease, spring } from '@/system/motion'
import { wait } from '@/system/latency'
import { useCinematic, useWide } from '../cinematic'
import { BALANCE_PENCE, TRIP_PENCE, WEEK } from '../data'
import { WaitlistForm } from '../WaitlistForm'
import { useVisitor } from '../visitor'

type Request = 'waiting' | 'approved' | 'declined'

const CAPTION: Record<Request, string> = {
  waiting: 'Try it: approve Ivy’s request. It’s a sample, so no real money moves.',
  approved: 'Stamped. £5.00 left the kitty for Ivy’s trip, and Ivy sees “Approved”.',
  declined: 'Ivy sees “Ada said no this time”.',
}

export function Hero({ onAnchor }: { onAnchor: (id: string) => void }): JSX.Element {
  const [request, setRequest] = useState<Request>('waiting')
  const [play, setPlay] = useState(0)
  const [approving, setApproving] = useState(false)
  const visitor = useVisitor()
  const approveRef = useRef<HTMLButtonElement>(null)
  const focusApprove = useRef(false)
  const resetRef = useRef<HTMLButtonElement>(null)
  const focusReset = useRef(false)
  const scene = useRef<HTMLElement>(null)
  const cinematic = useCinematic()
  const wide = useWide()
  const ivy = personById('ivy')
  // The self-demonstration: on a cinematic first view Theo's request waits, then Sam's stamp lands on it once,
  // after the ledger has settled; Ivy's request stays the visitor's to answer. Still compositions show it stamped.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!cinematic) return
    const timer = window.setTimeout(() => setShown(true), durationMs.hero + 1800)
    return () => window.clearTimeout(timer)
  }, [cinematic])
  const week = WEEK.map((line) =>
    line.id !== 'w4'
      ? line
      : cinematic && !shown
        ? { ...line, what: 'asked for £6.40 for a TfL top-up', note: undefined, stamp: undefined, ask: true }
        : cinematic
          ? { ...line, fresh: true }
          : line,
  )

  // The dive: progress over the scene's extra scroll (start at the top, end when it leaves).
  const { scrollYProgress } = useScroll({ target: scene, offset: ['start start', 'end end'] })
  const rotateX = useTransform(scrollYProgress, [0, 0.85], [22, 0])
  const rotateZ = useTransform(scrollYProgress, [0, 0.85], [-5, 0])
  const scale = useTransform(scrollYProgress, [0, 0.85], [0.94, 1.12])
  // The ledger moves to the centre only once the copy has scrolled away, so the two never overlap
  const x = useTransform(scrollYProgress, [0.5, 0.95], ['0%', '-46%'])
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.22])
  const veil = useTransform(scrollYProgress, [0.2, 0.9], [0, 0.72])

  // Focus follows the request: to Reset once the buttons have gone, back to Approve after a reset.
  useEffect(() => {
    if (request === 'waiting' && focusApprove.current) {
      focusApprove.current = false
      approveRef.current?.focus()
    } else if (request !== 'waiting' && focusReset.current) {
      focusReset.current = false
      resetRef.current?.focus({ preventScroll: true })
    }
  }, [request])

  const ask: LedgerLine =
    request === 'waiting'
      ? {
          id: 'ask',
          day: 'Wed',
          person: ivy,
          what: 'asked for £5.00 for the school trip',
          ask: true,
          actions: (
            <>
              <Button
                variant="quiet"
                size="sm"
                unavailableReason={approving ? 'Wait for the approval to finish' : undefined}
                onClick={() => {
                  focusReset.current = true
                  setRequest('declined')
                  announce('Declined. Ivy sees “Ada said no this time”.')
                }}
              >
                Decline
              </Button>
              <ActionButton
                ref={approveRef}
                variant="secondary"
                pendingLabel="Approving…"
                successLabel="Approved"
                successMessage={false}
                onAction={async (signal) => {
                  setApproving(true)
                  try {
                    await wait(600, signal)
                  } finally {
                    setApproving(false)
                  }
                }}
                onSuccess={() => {
                  setPlay((n) => n + 1)
                  focusReset.current = true
                  setRequest('approved')
                  visitor.setApproved(true)
                  announce(`Approved £5.00 for Ivy. In the kitty: ${formatPence(BALANCE_PENCE - TRIP_PENCE)}.`)
                }}
              >
                Approve £5.00
              </ActionButton>
            </>
          ),
        }
      : request === 'approved'
        ? { id: 'ask', day: 'Wed', person: ivy, what: 'School trip', pence: -TRIP_PENCE, note: 'Approved by you', tick: play, stamp: 'Approved', fresh: true }
        : { id: 'ask', day: 'Wed', person: ivy, what: 'asked for £5.00 for the school trip', note: 'You said no this time' }

  // Phones: the request leads, so the signature and its button are in the first screen (UX.md wireframe).
  const lines = wide ? [...week, ask] : [ask, ...week]
  const total = request === 'approved' ? BALANCE_PENCE - TRIP_PENCE : BALANCE_PENCE

  const ledger = (
    <Ledger
      title="The kitty · this week"
      label="Sample household"
      lines={lines}
      totalPence={total}
      write
      headingLevel={2}
      caption={
        <span className="fl-caption">
          <span>{CAPTION[request]}</span>
          {request !== 'waiting' ? (
            <button
              ref={resetRef}
              type="button"
              className="k-link fl-reset"
              onClick={() => {
                focusApprove.current = true
                setRequest('waiting')
                visitor.setApproved(false)
                announce('Sample reset.')
              }}
            >
              Reset the sample
            </button>
          ) : null}
        </span>
      }
    />
  )

  return (
    <section ref={scene} className="fl-scene" data-story="dive" data-cinematic={cinematic || undefined} aria-labelledby="hero-title">
      <div className="fl-scene__copy">
        <div className="fl-scene__paper">
          <h1 id="hero-title" className="fl-h1">
            Your family’s money, on{' '}
            <span className="fl-ink">
              one page.
              <svg className="fl-ink__line" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                <motion.path
                  d="M4 15 C 60 7, 120 20, 180 12 S 270 9, 296 14"
                  initial={{ pathLength: cinematic ? 0 : 1 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: durationMs.hero / 1000, delay: durationMs['3xl'] / 1000, ease: ease.enterEmphasized }}
                />
              </svg>
            </span>
          </h1>
          <p className="fl-lead">Kitty is a household payments app: parents and kids share one balance, and everyone sees who paid and who asked.</p>
          <div id="join-hero" className="fl-hero__form">
            <WaitlistForm />
            <p className="fl-note">Kitty isn’t open yet. We’ll email you when your household can start.</p>
          </div>
          <a
            className="k-link fl-secondary"
            href="#q-money"
            onClick={(event) => {
              event.preventDefault()
              onAnchor('q-money')
            }}
          >
            Who holds the money?
          </a>
        </div>
      </div>
      <div className="fl-scene__stage">
        <motion.img
          className="fl-scene__photo"
          src="/fintech-landing/kitchen-table.webp"
          srcSet="/fintech-landing/kitchen-table-768.webp 768w, /fintech-landing/kitchen-table.webp 1536w"
          sizes="(min-width: 64rem) 60vw, 100vw"
          width={1536}
          height={1024}
          alt=""
          fetchPriority="high"
          decoding="async"
          style={cinematic ? { scale: photoScale } : undefined}
        />
        <motion.div className="fl-scene__veil" aria-hidden="true" style={cinematic ? { opacity: veil } : undefined} />
        <div className="fl-scene__table">
          <motion.div
            className="fl-scene__ledger"
            data-moment="ledger"
            // The ledger lands on the table once: it settles from a little higher and steeper (no fade: it is readable at once).
            initial={cinematic ? { y: -28, rotateX: 34 } : false}
            animate={cinematic ? { y: 0, rotateX: 22 } : undefined}
            transition={spring.slow}
            style={cinematic ? { rotateX, rotateZ, scale, x } : undefined}
          >
            {ledger}
            {/* A paper note on the ledger, pointing at the one thing to try (the affordance; decorative, the caption says it too) */}
            {cinematic && request === 'waiting' ? (
              <motion.div
                className="fl-margin"
                data-moment="note"
                aria-hidden="true"
                initial={{ opacity: 0, y: distance.md, rotate: 9 }}
                animate={{ opacity: 1, y: 0, rotate: 5 }}
                transition={{ ...spring.slow, delay: durationMs.hero / 1000 + 0.9 }}
              >
                <span className="fl-margin__note">Your turn: you’re the parent</span>
                <svg className="fl-margin__arrow" viewBox="0 0 90 60">
                  <motion.path
                    d="M8 52 C 30 50, 58 40, 74 14 M 62 16 L 75 12 L 78 26"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: durationMs.hero / 1000, delay: durationMs.hero / 1000 + 1.3, ease: ease.enterEmphasized }}
                  />
                </svg>
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
