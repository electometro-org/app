// src/components/DemographicsForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAnalyticsConsent } from "../utils/analytics";
import { useTranslate } from "@tolgee/react";
import { defaultBranding } from "../config/branding";
import { BrandLogo } from "./BrandImage";

function getScrollParent(element) {
  if (!element) return document.scrollingElement || document.documentElement;

  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const styles = window.getComputedStyle(parent);
    const overflowY = styles.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.scrollingElement || document.documentElement;
}

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
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollDownFab, setShowScrollDownFab] = useState(false);
  const panelRef = useRef(null);
  const formRef = useRef(null);
  const submitRef = useRef(null);
  const scrollParentRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setShowScrollDownFab(false);
      return;
    }

    const anchor = submitRef.current || panelRef.current;
    if (!anchor) {
      setShowScrollDownFab(false);
      return;
    }

    const scrollParent = getScrollParent(anchor);
    scrollParentRef.current = scrollParent;
    const eventTarget = (scrollParent === document.documentElement || scrollParent === document.body)
      ? window
      : scrollParent;

    let rafId = null;
    let intervalId = null;

    const updateFabVisibility = () => {
      const submitEl = submitRef.current || panelRef.current;
      if (!submitEl) {
        setShowScrollDownFab(false);
        return;
      }

      const submitRect = submitEl.getBoundingClientRect();
      let viewportTop = 0;
      let viewportBottom = window.innerHeight || document.documentElement.clientHeight || 0;
      if (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
        const containerRect = scrollParent.getBoundingClientRect();
        viewportTop = containerRect.top;
        viewportBottom = containerRect.bottom;
      }

      const submitVisible = submitRect.top < (viewportBottom - 8) && submitRect.bottom > (viewportTop + 8);
      setShowScrollDownFab(!submitVisible);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updateFabVisibility();
      });
    };

    eventTarget.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    intervalId = setInterval(updateFabVisibility, 250);

    return () => {
      eventTarget.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMobile]);

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

  const handleScrollDownFabClick = () => {
    const form = formRef.current;
    if (!form) return;

    const scrollParent = scrollParentRef.current || getScrollParent(form);
    const isWindowScroll = !scrollParent || scrollParent === document.documentElement || scrollParent === document.body;
    const steps = Array.from(form.querySelectorAll('.wide-input, input[type="checkbox"], button[type="submit"]'));
    if (steps.length === 0) return;

    let viewportTop = 0;
    let viewportBottom = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!isWindowScroll) {
      const containerRect = scrollParent.getBoundingClientRect();
      viewportTop = containerRect.top;
      viewportBottom = containerRect.bottom;
    }
    const viewportHeight = Math.max(1, viewportBottom - viewportTop);
    const preferredStartLine = viewportTop + (viewportHeight * 0.62);

    const nextStep = steps.find((el) => el.getBoundingClientRect().top >= preferredStartLine);
    if (nextStep) {
      nextStep.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const submitEl = submitRef.current;
    if (submitEl) {
      submitEl.scrollIntoView({ behavior: "smooth", block: "end" });
      return;
    }

    if (isWindowScroll) {
      window.scrollBy({ top: viewportHeight * 0.7, behavior: "smooth" });
    } else {
      scrollParent.scrollBy({ top: viewportHeight * 0.7, behavior: "smooth" });
    }
  };

  return (
    <div className="demographics-panel" style={styles.panel} ref={panelRef}>
      <BrandLogo branding={branding} />
      <h2>{t('demographics.title')}</h2>
      <form onSubmit={onLocalConfirm} ref={formRef}>
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
            ref={submitRef}
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

      {isMobile && showScrollDownFab && createPortal(
        <button
          className="topic-scroll-down-fab"
          type="button"
          onClick={handleScrollDownFabClick}
          aria-label={t("topicImportance.seeMoreTopics")}
          title={t("topicImportance.seeMoreTopics")}
        >
          <span>{t("topicImportance.seeMoreTopics")}</span>
          <span aria-hidden="true">▼</span>
        </button>,
        document.body
      )}
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
