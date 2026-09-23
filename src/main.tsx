import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2600,
            style: {
              background: '#14172a',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '14px',
              padding: '10px 16px',
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
