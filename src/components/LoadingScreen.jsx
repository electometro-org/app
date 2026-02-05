import { useState, useEffect } from 'react'
import './LoadingScreen.css'
import { preSelectedElectionId } from '../config/appConfig'
import { getElectionConfig } from '../elections'
import { getBranding, defaultBranding } from '../config/branding'
import { colors as defaultColors } from '../colors'

function getElectionStyles() {
  if (preSelectedElectionId) {
    const electionConfig = getElectionConfig(preSelectedElectionId)
    if (electionConfig) {
      const branding = getBranding(electionConfig)
      const theme = { ...defaultColors, ...electionConfig.theme }
      const loadingScreen = electionConfig.loadingScreen || {}

      return {
        logo: branding.logoAlt || branding.logo,
        style: {
          '--accent': theme.accent,
          '--accentLight': theme.accentLight,
          '--background': theme.background,
          '--loading-background': loadingScreen.background,
          '--loading-spinner-primary': loadingScreen.spinnerPrimary,
          '--loading-spinner-secondary': loadingScreen.spinnerSecondary,
        }
      }
    }
  }
  return {
    logo: defaultBranding.logoAlt || defaultBranding.logo,
    style: {
      '--accent': defaultColors.accent,
      '--accentLight': defaultColors.accentLight,
      '--background': defaultColors.background,
    }
  }
}

function LoadingScreen() {
  const { logo, style } = getElectionStyles()

  return (
    <div className="loading-screen" style={style}>
      <div className="loading-logo-container">
        <img
          src={logo}
          alt="Electómetro"
          className="loading-logo"
        />
        <div className="loading-spinner-ring"></div>
      </div>
    </div>
  )
}

export function LoadingWrapper({ children, minDelay = 500 }) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), minDelay)
    return () => clearTimeout(timer)
  }, [minDelay])

  if (!showContent) {
    return <LoadingScreen />
  }

  return children
}

export default LoadingScreen