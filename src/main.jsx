import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TolgeeProvider } from "@tolgee/react";
import { tolgee } from './config/tolgee.js'
import { QuizProvider } from './contexts/QuizContext.jsx'
import { BackgroundProvider } from './backgrounds'
import { WidgetProvider } from './widgets'
import LoadingScreen, { LoadingWrapper } from './components/LoadingScreen.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <TolgeeProvider
      tolgee={tolgee}
      fallback={<LoadingScreen />}
  >
    <LoadingWrapper minDelay={500}>
      <StrictMode>
        <ErrorBoundary onRetry={() => window.location.reload()}>
          <QuizProvider>
            <BackgroundProvider>
              <WidgetProvider>
                <App />
              </WidgetProvider>
            </BackgroundProvider>
          </QuizProvider>
        </ErrorBoundary>
      </StrictMode>
    </LoadingWrapper>
  </TolgeeProvider>,
)
