import { FLAVOURS, TIER_SIZES, type Design } from './data'

const FINISH_WORDS: Record<Design['finish'], string> = {
  fondant: 'in fondant',
  buttercream: 'in buttercream',
  'semi-naked': 'semi-naked',
  naked: 'naked, the layers showing',
}
const FLOWER_WORDS: Record<Design['flowers'], string> = {
  none: '',
  spray: ' with a spray of sugar flowers',
  cascade: ' with a cascade of sugar peonies',
  crown: ' with a crown of sugar flowers',
}

/** The cake in words (CONTENT.md, cake stand `slot.description`): what the 3D view and the poster show. */
export function describe(design: Design): string {
  const sizes = (TIER_SIZES[design.tiers] ?? TIER_SIZES[3]).join(', ')
  const flavours = design.flavours.map((id) => FLAVOURS.find((f) => f.id === id)?.name.toLowerCase()).filter(Boolean)
  return `A ${design.tiers}-tier ${design.shape} cake (${sizes} inch) ${FINISH_WORDS[design.finish]}${FLOWER_WORDS[design.flowers]}${
    design.goldLeaf ? ' and pressed gold leaf' : ''
  }${flavours.length ? `; flavours: ${flavours.join(', ')}` : ''}.`
}
