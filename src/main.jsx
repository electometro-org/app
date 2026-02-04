import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TolgeeProvider } from "@tolgee/react";
import { tolgee } from './tolgee.js'
import { QuizProvider } from './contexts/QuizContext.jsx'

createRoot(document.getElementById('root')).render(
  <TolgeeProvider
      tolgee={tolgee}
      fallback="Loading..."
  >
    <StrictMode>
      <QuizProvider>
        <App />
      </QuizProvider>
    </StrictMode>
  </TolgeeProvider>,
)
