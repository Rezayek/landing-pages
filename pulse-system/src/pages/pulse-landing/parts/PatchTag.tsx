/**
 * The patch tag (CONCEPT: concept 2's borrowed detail): a hanging bone-paper tag that names the visitor's sound and
 * shows its three main values, live. Used beside the hero's pre-order and in the pre-order section.
 */
import type { JSX } from 'react'
import { engine, fmt } from '@/system/instrument'
import { useYourPatch } from './yourPatch'
import './parts.css'

const WAVE_SHORT = { sine: 'SIN', triangle: 'TRI', sawtooth: 'SAW', square: 'SQR' } as const

export function PatchTag({ heading = 'Your patch' }: { heading?: string }): JSX.Element {
  const { patch } = engine.useEngine()
  const { name, edited } = useYourPatch()
  return (
    <div className="pl-tag">
      <span className="pl-tag__hole" aria-hidden="true" />
      <span className="pi-legend">{heading}</span>
      <strong>
        {name}
        {edited ? <span className="pl-tag__edited"> · edited</span> : null}
      </strong>
      <dl>
        <div>
          <dt className="pi-legend">Wave</dt>
          <dd>{WAVE_SHORT[patch.wave]}</dd>
        </div>
        <div>
          <dt className="pi-legend">Cutoff</dt>
          <dd>{fmt.hz(patch.cutoff).shown}</dd>
        </div>
        <div>
          <dt className="pi-legend">Reso</dt>
          <dd>Q {patch.resonance.toFixed(1)}</dd>
        </div>
      </dl>
    </div>
  )
}
