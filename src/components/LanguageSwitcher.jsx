import React from 'react';
import { useTranslate, useTolgee } from '@tolgee/react';
import { esLang, quLang, ayLang } from '../config/tolgee';
import { trackEvent } from '../utils/analytics';
import './LanguageSwitcher.css';

function changeLanguage(tolgee, code) {
  trackEvent('language_changed', { language: code });
  tolgee.changeLanguage(code);
}

export default function LanguageSwitcher() {
  const { t } = useTranslate();
  const tolgee = useTolgee(['language']);
  const current = tolgee.getLanguage();

  const languages = [
    { code: esLang, label: t('languages.spanish') },
    { code: quLang, label: t('languages.quechua') },
    { code: ayLang, label: t('languages.aymara') },
  ];

  return (
    <div className="language-switcher">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`language-switcher__btn ${current === code ? 'is-active' : ''}`}
          aria-pressed={current === code}
          onClick={() => changeLanguage(tolgee, code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Segmented "pill" version of the language switcher: | Español | Quechua | Aymara |
 * The active language is filled with the election's accent color.
 */
export function LanguagePill() {
  const { t } = useTranslate();
  const tolgee = useTolgee(['language']);
  const current = tolgee.getLanguage();

  const languages = [
    { code: esLang, label: t('languages.spanish') },
    { code: quLang, label: t('languages.quechua') },
    { code: ayLang, label: t('languages.aymara') },
  ];

  return (
    <div className="language-pill" role="group">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`language-pill__btn ${current === code ? 'is-active' : ''}`}
          aria-pressed={current === code}
          onClick={() => changeLanguage(tolgee, code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
