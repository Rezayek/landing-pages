import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Gallery } from '@/Gallery'
import { PageRoute, SystemRoute } from '@/pages/PageRoute'
import '@/index.css'

// The project's design tokens, once phase 6 has written them (src/system/tokens.css). Optional on purpose: the
// starter has none, and this pattern matches nothing until the file exists. Page-level tokens stay in each page.
import.meta.glob('./system/tokens.css', { eager: true })

// Four routes: the gallery at "/", every page at "/p/<slug>", the project's system at "/system" and, for projects
// where each page owns its system (systemScope "page"), that system at "/p/<slug>/system". The plugin's scripts
// build these URLs from ui-ux.config.json (`pagePath`, `systemRoute`), so keep the shapes or change both together.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/p/:slug" element={<PageRoute />} />
          <Route path="/p/:slug/system" element={<PageRoute system />} />
          <Route path="/system" element={<SystemRoute />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
