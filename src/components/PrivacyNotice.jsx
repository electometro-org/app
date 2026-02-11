// src/components/PrivacyNotice.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslate } from "@tolgee/react";
import "./PrivacyNotice.css";

export default function PrivacyNotice() {
  const { t } = useTranslate();
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Check if user has already seen the notice
    const noticeSeen = localStorage.getItem("privacyNoticeSeen");
    if (!noticeSeen) {
      // Show after a brief delay to avoid disruption
      setTimeout(() => setShowNotice(true), 2000);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("privacyNoticeSeen", "true");
    setShowNotice(false);
  };

  if (!showNotice) return null;

  return (
    <div className="privacy-notice">
      <div className="privacy-notice-content">
        <button
          className="privacy-notice-close"
          onClick={handleDismiss}
          aria-label={t('privacyNotice.closeLabel')}
        >
          ×
        </button>
        <p>
          <strong>{t('privacyNotice.title')}</strong>
          <br />
          {t('privacyNotice.description')}{' '}
          <Link to="/politica-privacidad">{t('privacyNotice.moreInfo')}</Link>
        </p>
      </div>
    </div>
  );
}
