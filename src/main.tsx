import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './real.css'
import './real-project.css'
import './share-modal.css'
import './plans.css'
import './callsheet.css'
import './export.css'
import App from './App.tsx'
import { StoreProvider } from './lib/store.tsx'
import spriteRaw from './assets/sprite.svg?raw'

// The real product puts its SVG sprite inline at the top of <body>.
// Keep the exact symbols available for every <use href="#icons_...">.
if (typeof document !== 'undefined' && !document.getElementById('mediastory-sprite-host')) {
  const host = document.createElement('div')
  host.id = 'mediastory-sprite-host'
  host.style.display = 'contents'
  host.innerHTML = spriteRaw
  document.body.prepend(host)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
