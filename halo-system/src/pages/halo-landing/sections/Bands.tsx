/**
 * S5 Bands (UX.md): the five bands on the paper stage, each a still of the same 3D model in that band
 * (public/halo-landing/band-<id>.webp, captured from the scene). Choosing one sets the band in S4: one state (A12).
 * Composed as a split (critique round 2, D4): the chosen band large on its own card, cross-faded on the product
 * when it changes, beside the five as a list of rows with a close crop of each.
 */
import { type JSX } from 'react'
import { BANDS, type Build } from '@/system/halo'

export interface BandsProps {
  build: Build
  onChange: (patch: Partial<Build>) => void
}

export function Bands({ build, onChange }: BandsProps): JSX.Element {
  const chosen = BANDS.find((b) => b.id === build.band) ?? BANDS[0]
  return (
    <section id="bands" className="bands" aria-labelledby="bands-title" data-stage="paper">
      <figure className="bands__feature">
        <div className="bands__stage">
          {BANDS.map((b) => (
            <img
              key={b.id}
              className="bands__still"
              data-on={b.id === chosen.id || undefined}
              src={`/halo-landing/band-${b.id}.webp`}
              width={960}
              height={1200}
              alt={b.id === chosen.id ? `HALO with the ${b.label} band` : ''}
              aria-hidden={b.id === chosen.id ? undefined : true}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
        <figcaption className="bands__caption">
          <span className="bands__chosen">{chosen.label}</span>
          <span className="bands__spec">Moulded silicone · 24 mm · steel pin and keeper</span>
        </figcaption>
      </figure>
      <div className="bands__side">
        <div className="bands__copy">
          <h2 id="bands-title" className="section-title">
            Five bands, one pin.
          </h2>
          <p className="section-sub">Moulded silicone, 24 mm wide, fastened with a steel pin and a keeper. Choose one and it goes on the watch above.</p>
        </div>
        <fieldset className="bands__row">
          <legend className="h-sr">Band</legend>
          {BANDS.map((b) => (
            <label key={b.id} className="band-card" data-on={b.id === build.band || undefined}>
              <input type="radio" name="band-flat" value={b.id} checked={b.id === build.band} onChange={() => onChange({ band: b.id })} className="band-card__input" />
              <span className="band-card__crop" aria-hidden="true">
                <img className="band-card__img" src={`/halo-landing/band-${b.id}.webp`} width={960} height={1200} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="band-card__text">
                <span className="band-card__name">{b.label}</span>
                {b.soldOutIn ? <span className="band-card__note">41 mm from December</span> : null}
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </section>
  )
}
