/** The chrome's theme choice (System, Light, Dark), stored as `halo-theme`; index.html applies it before first paint. */
export type ThemeChoice = 'system' | 'light' | 'dark'

export function readTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem('halo-theme')
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(choice: ThemeChoice): void {
  if (choice === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = choice
  try {
    if (choice === 'system') localStorage.removeItem('halo-theme')
    else localStorage.setItem('halo-theme', choice)
  } catch {
    // storage blocked: the choice lasts for this visit
  }
}
