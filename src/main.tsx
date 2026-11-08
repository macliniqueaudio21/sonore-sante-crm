import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './store.tsx'
import { DesignProvider } from './design.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </DesignProvider>
  </StrictMode>,
)
