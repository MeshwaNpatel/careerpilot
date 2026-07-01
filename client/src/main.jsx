import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply dark class before first render to prevent flash
const stored = localStorage.getItem('cp_dark_mode');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (stored === 'true' || (stored === null && prefersDark)) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
