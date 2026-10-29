/**
 * S6 Specs (UX.md): the exact numbers, plainly. Three light figures as the only large type (steal #7), then the
 * system's spec list with Battery open (A15). Every figure is illustrative and says so.
 */
import { type JSX } from 'react'
import { Figure, SPECS, SpecList } from '@/system/halo'

export function Specs(): JSX.Element {
  return (
    <section id="specs" className="specs" aria-labelledby="specs-title" data-stage="black">
      <h2 id="specs-title" className="section-title">
        The numbers.
      </h2>
      <div className="specs__figures">
        <Figure value="14" unit="days" caption="Everyday battery, up to" size="display" />
        <Figure value="40" unit="h" caption="GPS training with dual-band, up to" size="display" />
        <Figure value="100" unit="m" caption="Water resistance" size="display" />
      </div>
      <SpecList groups={SPECS} initiallyOpen={['battery']} />
      <p className="specs__note">Illustrative figures. HALO is a design study.</p>
    </section>
  )
}
