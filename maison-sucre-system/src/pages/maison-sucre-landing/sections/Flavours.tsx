/**
 * S6 Flavours (UX.md §S6, Q6; inventory A17-A18). The behaviour follows FlavoursScenario in the system's scenarios:
 * keeping is optimistic ("Keeping…", failure with Try again on the card), removal from the box is instant with a
 * 10 s Undo toast, the box has its first-use and cleared states. The waits are simulated with `simulate()` and read
 * the page's latency. Page mounts ToastRegion and LiveRegion.
 */
import { useCallback, useState, type JSX } from 'react'
import { BOX_SIZE, FLAVOURS, FlavourCard, TastingBox, type Flavour } from '@/system/cake'
import { announce } from '@/system/feedback'
import { simulate, type LatencyId } from '@/system/latency'
import { BeadBorder, TextLink } from '@/system/ui'
import './flavours.css'

export function Flavours({ latency }: { latency: LatencyId }): JSX.Element {
  const [kept, setKept] = useState<Flavour[]>([])
  const [emptied, setEmptied] = useState(false)

  // A17: the card flips first; this is the box's answer (it rejects when the latency is "fail")
  const onToggle = useCallback(
    async (flavour: Flavour, keep: boolean): Promise<void> => {
      await simulate(latency, true)
      setKept((all) => (keep ? (all.some((f) => f.id === flavour.id) || all.length >= BOX_SIZE ? all : [...all, flavour]) : all.filter((f) => f.id !== flavour.id)))
      if (!keep) setEmptied(true)
    },
    [latency],
  )

  // A18: local and instant; the toast with Undo comes from the box
  const onRemove = useCallback((flavour: Flavour): void => {
    setKept((all) => all.filter((f) => f.id !== flavour.id))
    setEmptied(true)
  }, [])
  const onRestore = useCallback((flavour: Flavour, index: number): void => {
    setKept((all) => {
      if (all.some((f) => f.id === flavour.id) || all.length >= BOX_SIZE) return all
      const next = [...all]
      next.splice(Math.min(index, next.length), 0, flavour)
      return next
    })
    announce(`${flavour.name} put back`)
  }, [])

  return (
    <section id="flavours" className="flv" aria-labelledby="flavours-title">
      <div className="flv__inner">
        <header className="flv__head">
          <h2 id="flavours-title" className="flv__title">
            Flavours
          </h2>
          <BeadBorder variant="shell" className="flv__rule" />
          <p className="flv__sub">Keep up to six to taste. Allergens are named on every card.</p>
        </header>

        <div className="flv__layout">
          <div className="flv__box">
            <TastingBox kept={kept} cleared={emptied && kept.length === 0} onRemove={onRemove} onRestore={onRestore} />
          </div>

          <div className="flv__main">
            <ul className="flv__grid" role="list">
              {FLAVOURS.map((flavour) => (
                <li key={flavour.id} className="flv__item">
                  <FlavourCard flavour={flavour} kept={kept.some((f) => f.id === flavour.id)} boxFull={kept.length >= BOX_SIZE} onToggle={onToggle} />
                </li>
              ))}
            </ul>
            <p className="flv__note">We can bake gluten-free tiers. Tell us about any allergy at the tasting, and we'll plan it with you.</p>
            {/* the tasting box carries this link once it holds a flavour; before that, it lives here */}
            {kept.length === 0 ? (
              <p className="flv__action">
                <TextLink standalone href="#tastings">
                  Book a tasting for these flavours
                </TextLink>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
