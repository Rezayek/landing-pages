/**
 * The page's small stores: the cart (kept on this device, localStorage), price alerts (this visit only), the scene
 * bus (the HTML tells the 3D street what happened) and the simulated waits. Nothing is sent anywhere: VOLTCART is a
 * design study. `?latency=<preset>` from the system's latency.ts drives every wait, as on /system.
 */
import { useSyncExternalStore } from 'react'
import { announce } from '@/system/feedback'
import { parseLatency, simulate, wait } from '@/system/latency'

/* Cart --------------------------------------------------------------------------------------------------------------- */
const CART_KEY = 'voltcart-landing-cart'

export interface CartState {
  items: readonly string[]
  removed: readonly string[]
}

function load(): CartState {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const items = raw ? (JSON.parse(raw) as unknown) : []
    return { items: Array.isArray(items) ? items.filter((x): x is string => typeof x === 'string') : [], removed: [] }
  } catch {
    return { items: [], removed: [] }
  }
}

let cart: CartState = load()
const cartListeners = new Set<() => void>()

function setCart(next: CartState): void {
  cart = next
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(next.items))
  } catch {
    /* storage blocked: the cart lasts for this visit */
  }
  cartListeners.forEach((fn) => fn())
}

export const cartStore = {
  subscribe(fn: () => void): () => void {
    cartListeners.add(fn)
    return () => cartListeners.delete(fn)
  },
  get: (): CartState => cart,
  add(id: string, title: string): void {
    if (cart.items.includes(id)) return
    const items = [...cart.items, id]
    setCart({ items, removed: cart.removed.filter((r) => r !== id) })
    announce(`Added ${title} to your cart. Cart: ${items.length} ${items.length === 1 ? 'item' : 'items'}.`)
  },
  remove(id: string, title: string): void {
    if (!cart.items.includes(id)) return
    setCart({ items: cart.items.filter((x) => x !== id), removed: [id, ...cart.removed.filter((r) => r !== id)] })
    announce(`Removed ${title} from your cart. Undo is in your cart.`)
  },
  undo(id: string, title: string): void {
    setCart({ items: [...cart.items, id], removed: cart.removed.filter((r) => r !== id) })
    announce(`${title} is back in your cart.`)
  },
}

export function useCart(): CartState {
  return useSyncExternalStore(cartStore.subscribe, cartStore.get, cartStore.get)
}

/* Price alerts (this visit only) --------------------------------------------------------------------------------------- */
let alerts: Readonly<Record<string, number>> = {}
const alertListeners = new Set<() => void>()

export const alertStore = {
  subscribe(fn: () => void): () => void {
    alertListeners.add(fn)
    return () => alertListeners.delete(fn)
  },
  get: (): Readonly<Record<string, number>> => alerts,
  set(id: string, below: number): void {
    alerts = { ...alerts, [id]: below }
    alertListeners.forEach((fn) => fn())
  },
  clear(id: string): void {
    const next = { ...alerts }
    delete next[id]
    alerts = next
    alertListeners.forEach((fn) => fn())
  },
}

export function useAlerts(): Readonly<Record<string, number>> {
  return useSyncExternalStore(alertStore.subscribe, alertStore.get, alertStore.get)
}

/* Scene bus: what the street should echo ------------------------------------------------------------------------------- */
export type SceneEvent = { type: 'pulse'; kiosk: number } | { type: 'dispense' }
const sceneListeners = new Set<(event: SceneEvent) => void>()

export const sceneBus = {
  emit(event: SceneEvent): void {
    sceneListeners.forEach((fn) => fn(event))
  },
  on(fn: (event: SceneEvent) => void): () => void {
    sceneListeners.add(fn)
    return () => sceneListeners.delete(fn)
  },
}

/* Simulated waits ------------------------------------------------------------------------------------------------------ */
const urlLatency = typeof window === 'undefined' ? null : parseLatency(new URLSearchParams(window.location.search).get('latency'))

/**
 * A simulated request. With `?latency=` the system's preset decides (fast, slow, very-slow, stalled, fail); without
 * it, an "acknowledged" wait of 300-900 ms (UX.md A5, A11; assumed).
 */
export async function simulated<T>(value: T, signal?: AbortSignal): Promise<T> {
  if (urlLatency) return simulate(urlLatency, value, signal)
  await wait(300 + Math.random() * 600, signal)
  return value
}
