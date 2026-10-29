/**
 * One set of surface maps for the whole page: built once in a Web Worker (mapsWorker.ts), turned into textures once,
 * and shared by every watch on every canvas, so a second canvas costs nothing to texture and nothing stalls the main
 * thread. `use(loadMaps())` suspends a watch until the maps are ready; the poster holds the frame meanwhile.
 * The textures live as long as the page: a watch that unmounts never disposes them.
 */
import { DataTexture, LinearMipmapLinearFilter, LinearFilter, NoColorSpace, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three'
import { buildAll, type RawMap, type RawMaps } from './maps'

export interface Maps {
  blasted: { rough: DataTexture; normal: DataTexture }
  brushed: { rough: DataTexture; normal: DataTexture }
  silicone: { rough: DataTexture; normal: DataTexture }
  turned: DataTexture
  wrinkle: DataTexture
}

function texture(raw: RawMap, repeat: [number, number], offset: [number, number] = [0, 0]): DataTexture {
  const t = new DataTexture(raw.data, raw.size, raw.size, RGBAFormat, UnsignedByteType)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(...repeat)
  t.offset.set(...offset)
  t.colorSpace = NoColorSpace
  t.generateMipmaps = true
  t.minFilter = LinearMipmapLinearFilter
  t.magFilter = LinearFilter
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

function toTextures(raw: RawMaps): Maps {
  // the pocket floor's UVs are its own units (3.9 across): fit one lathe pattern to it, centred
  const inner = 3.9
  return {
    blasted: { rough: texture(raw.blasted.rough, [1.4, 1.4]), normal: texture(raw.blasted.normal, [1.4, 1.4]) },
    brushed: { rough: texture(raw.brushed.rough, [0.6, 0.6]), normal: texture(raw.brushed.normal, [0.6, 0.6]) },
    silicone: { rough: texture(raw.silicone.rough, [3, 5]), normal: texture(raw.silicone.normal, [3, 5]) },
    turned: texture(raw.turned, [1 / inner, 1 / inner], [0.5, 0.5]),
    wrinkle: texture(raw.wrinkle, [0.45, 0.45]),
  }
}

let pending: Promise<Maps> | null = null

export function loadMaps(): Promise<Maps> {
  if (pending) return pending
  pending = new Promise<RawMaps>((resolve) => {
    try {
      const worker = new Worker(new URL('./mapsWorker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<RawMaps>) => {
        resolve(event.data)
        worker.terminate()
      }
      worker.onerror = () => {
        // no worker (an old browser, a blocked script): build them here, once
        resolve(buildAll())
        worker.terminate()
      }
      worker.postMessage('build')
    } catch {
      resolve(buildAll())
    }
  }).then(toTextures)
  return pending
}
