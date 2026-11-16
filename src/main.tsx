import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme/decor.css'
import App from './App.tsx'
import { reloadOnceForStaleBuild } from './utils/staleBuild'

window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForStaleBuild()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
