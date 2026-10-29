/**
 * HALO's components (COMPONENTS.md): import from here so the stylesheet and the effects come with them.
 */
import '../vfx'
import './halo.css'

export * from './data'
export { Watch } from './Watch'
export type { WatchProps, WatchView } from './Watch'
export {
  Button,
  DialControl,
  ErrorSummary,
  Field,
  Figure,
  IconButton,
  SegmentedChoice,
  SpecList,
  SwatchPicker,
  TextLink,
  ThemeSwitch,
} from './controls'
export { applyTheme, readTheme } from './theme'
export type { ThemeChoice } from './theme'
export { OrderBar, OrderSheet, PriceSummary, ProductViewer } from './product'
export type { FramesState, PriceState } from './product'
export { Footer, Header, SkipLink, Wordmark } from './chrome'
export type { FooterProps, HeaderProps } from './chrome'
export * from './icons'
