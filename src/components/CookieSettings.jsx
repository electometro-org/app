// src/components/CookieSettings.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsConsent, setAnalyticsConsent } from "../analytics";
import { useTranslate } from "@tolgee/react";
import BackToQuizButton from "./BackToQuizButton";
import "./CookieSettings.css";

export default function CookieSettings() {
  const { t } = useTranslate();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load current consent status
    setAnalyticsEnabled(getAnalyticsConsent());
  }, []);

  const handleSave = () => {
    setAnalyticsConsent(analyticsEnabled);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    // Reload page to apply changes
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="cookie-settings-container">
      <h1>{t('cookieSettings.title')}</h1>

      <p>
        {t('cookieSettings.description')}{" "}
        <Link to="/politica-privacidad">{t('cookieSettings.privacyPolicyLink')}</Link> {t('cookieSettings.descriptionContinued')}
      </p>

      <div className="settings-section">
        <h2>{t('cookieSettings.essentialCookiesTitle')}</h2>
        <div className="setting-item">
          <div className="setting-info">
            <h3>{t('cookieSettings.antiBotTitle')}</h3>
            <p>
              {t('cookieSettings.antiBotDescription')}
            </p>
          </div>
          <div className="setting-control">
            <span className="setting-status always-active">{t('common.alwaysActive')}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>{t('cookieSettings.fingerprintTitle')}</h2>
        <div className="setting-item">
          <div className="setting-info">
            <h3>{t('cookieSettings.duplicateDetectionTitle')}</h3>
            <p>
              {t('cookieSettings.duplicateDetectionDescription')}
            </p>
          </div>
          <div className="setting-control">
            <span className="setting-status always-active">{t('common.alwaysActive')}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>{t('cookieSettings.analyticsTitle')}</h2>
        <div className="setting-item">
          <div className="setting-info">
            <h3>{t('cookieSettings.analyticsImprovementTitle')}</h3>
            <p>
              {t('cookieSettings.analyticsImprovementDescription')}
            </p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-button" onClick={handleSave}>
          {t('common.savePreferences')}
        </button>
        <BackToQuizButton inline />
        {saved && <span className="save-confirmation">{t('common.preferencesSaved')}</span>}
      </div>
    </div>
  );
}