// src/components/DemographicsForm.jsx
import React, { useState } from "react";
import { getAnalyticsConsent } from "../analytics";
import { useTranslate } from "@tolgee/react";
import { defaultBranding } from "../config/branding";
import { BrandLogo } from "./BrandImage";

export default function DemographicsForm({ onConfirm, disabled = false, initialValues = null, branding = defaultBranding, regions = [] }) {
  const { t } = useTranslate();
  const [gender, setGender] = useState(initialValues?.gender || "");
  const [age, setAge] = useState(initialValues?.age || "");
  const [education, setEducation] = useState(initialValues?.education || "");
  const [region, setRegion] = useState(initialValues?.region || "");
  const [city, setCity] = useState(initialValues?.city || "");
  const [analyticsConsent, setAnalyticsConsent] = useState(
    initialValues?.analyticsConsent !== undefined ? initialValues.analyticsConsent : getAnalyticsConsent()
  );

  const onLocalConfirm = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const regionValue = region === "abroad" ? "Extranjero" : (region || null);

    const payload = {
      gender: gender || null,
      age: age ? Number(age) : null,
      education: education || null,
      region: regionValue,
      city: city?.trim() || null,
      analyticsConsent: analyticsConsent,
    };
    if (typeof onConfirm === "function") onConfirm(payload);
  };

  return (
    <div className="demographics-panel" style={styles.panel}>
      <BrandLogo branding={branding} />
      <h2>{t('demographics.title')}</h2>
      <form onSubmit={onLocalConfirm}>
        <div style={styles.field}>
          <select className="wide-input" value={gender} onChange={(e) => setGender(e.target.value)} disabled={disabled}>
            <option value="">{t('demographics.gender')}</option>
            <option value="male">{t('demographics.genderMale')}</option>
            <option value="female">{t('demographics.genderFemale')}</option>
            <option value="diverse">{t('demographics.genderDiverse')}</option>
          </select>
        </div>

        <div style={styles.field}>
          <input
            className="wide-input"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={2}
            value={age}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d{0,2}$/.test(v)) {
                setAge(v);
              }
            }}
            placeholder={t('demographics.age')}
            disabled={disabled}
          />
        </div>

        <div style={styles.field}>
          <select className="wide-input" value={education} onChange={(e) => setEducation(e.target.value)} disabled={disabled}>
            <option value="">{t('demographics.education')}</option>
            <option value="primary">{t('demographics.educationPrimary')}</option>
            <option value="secondary">{t('demographics.educationSecondary')}</option>
            <option value="undergraduate">{t('demographics.educationUndergraduate')}</option>
            <option value="graduate">{t('demographics.educationPostgraduate')}</option>
          </select>
        </div>

        <div style={styles.field}>
          <select className="wide-input" value={region} onChange={(e) => setRegion(e.target.value)} disabled={disabled}>
            <option value="">{t('demographics.region')}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <input
            className="wide-input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('demographics.city')}
            disabled={disabled}
          />
        </div>

        <div style={styles.consentBox}>
          <label style={styles.consentLabel}>
            <input
              type="checkbox"
              checked={analyticsConsent}
              onChange={(e) => setAnalyticsConsent(e.target.checked)}
              disabled={disabled}
              style={styles.checkbox}
            />
            <span>
              <strong>{t('demographics.analyticsConsent')}</strong>
              <br />
              <span style={styles.consentSubtext}>
                {t('demographics.analyticsDescription')}
              </span>
            </span>
          </label>
        </div>

        <div style={styles.submitContainer}>
          <button
            type="submit"
            className="back-and-skip-buttons"
            style={styles.submitButton}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accentLight)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
            disabled={disabled}
          >
            {t('demographics.showResults')}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  panel: { padding: 16, maxWidth: 560 },
  field: { marginBottom: 8 },
  consentBox: {
    marginTop: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    border: '1px solid #ddd'
  },
  consentLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    cursor: 'pointer',
    fontSize: 14
  },
  checkbox: { marginRight: 10, marginTop: 2, flexShrink: 0 },
  consentSubtext: { fontSize: 13, color: '#666' },
  submitContainer: { marginTop: 12 },
  submitButton: { backgroundColor: "var(--accent)", transition: "background-color 0.2s ease-in-out" }
};
