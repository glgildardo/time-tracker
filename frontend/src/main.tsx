import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize theme before rendering to prevent flash
const initializeTheme = () => {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.classList.toggle('dark', stored === 'dark');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
};

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
