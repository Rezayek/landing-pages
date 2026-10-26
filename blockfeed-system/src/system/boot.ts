/**
 * Side effects the system needs before first paint: the self-hosted pixel face (Jersey 10, SIL OFL 1.1, latin subset,
 * one weight) and the two backdrop tiles. Imported once by main.tsx and by the system's barrel.
 *
 * Jersey 10 is drawn on a 10-pixel em, so at a font size of ten units (`calc(var(--u) * 10)`) one pixel of the font is
 * exactly one unit of the interface: text sits on the same grid as every border, bevel and sprite. It has one weight;
 * emphasis comes from colour, the drop shadow and size, as it does in the game.
 */
import '@fontsource/jersey-10/latin-400.css'
import { applyTextures } from './pixel/textures'

applyTextures()
