import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

/**
 * Ports come from ui-ux.config.json (`devUrl`, `previewUrl`), the file the UI/UX plugin's scripts read, so Vite
 * and the scripts always agree. UIUX_PORT / UIUX_PREVIEW_PORT override them; the last fallback is the port
 * /ui-ux:init wrote here.
 */
const CONFIG = new URL('./ui-ux.config.json', import.meta.url)

function configPort(key: 'devUrl' | 'previewUrl'): number | undefined {
  if (!existsSync(CONFIG)) return undefined
  try {
    const value = (JSON.parse(readFileSync(CONFIG, 'utf8')) as Record<string, unknown>)[key]
    const port = typeof value === 'string' ? Number(new URL(value).port) : Number.NaN
    return port > 0 ? port : undefined
  } catch {
    return undefined
  }
}

function port(env: string | undefined, key: 'devUrl' | 'previewUrl', fallback: string): number {
  const value = Number(env) || configPort(key) || Number(fallback)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`No port for ${key}: set it in ui-ux.config.json (e.g. "http://localhost:5190").`)
  }
  return value
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: port(process.env.UIUX_PORT, 'devUrl', '5200'), strictPort: true },
  preview: { port: port(process.env.UIUX_PREVIEW_PORT, 'previewUrl', '5201'), strictPort: true },
})
