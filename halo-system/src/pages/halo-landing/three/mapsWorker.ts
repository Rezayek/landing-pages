/// <reference lib="webworker" />
/** Builds the watch's surface maps off the main thread and hands the pixel buffers back without copying. */
import { buffers, buildAll } from './maps'

self.onmessage = () => {
  const maps = buildAll()
  ;(self as unknown as DedicatedWorkerGlobalScope).postMessage(maps, buffers(maps))
}
