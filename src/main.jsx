import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TolgeeProvider } from "@tolgee/react";
import { tolgee } from './tolgee.js'
import { QuizProvider } from './contexts/QuizContext.jsx'
import { BackgroundProvider } from './backgrounds'
import { WidgetProvider } from './widgets'
import LoadingScreen, { LoadingWrapper } from './components/LoadingScreen.jsx'

createRoot(document.getElementById('root')).render(
  <TolgeeProvider
      tolgee={tolgee}
      fallback={<LoadingScreen />}
  >
    <LoadingWrapper minDelay={500}>
      <StrictMode>
        <QuizProvider>
          <BackgroundProvider>
            <WidgetProvider>
              <App />
            </WidgetProvider>
          </BackgroundProvider>
        </QuizProvider>
      </StrictMode>
    </LoadingWrapper>
  </TolgeeProvider>,
)
