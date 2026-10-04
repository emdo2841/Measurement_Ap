import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/toast/ToastProvider'
import AppErrorBoundary from './components/error/AppErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
