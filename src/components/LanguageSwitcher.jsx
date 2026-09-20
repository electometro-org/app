import React from 'react';
import { useTranslate, useTolgee } from '@tolgee/react';
import { esLang, quLang, ayLang } from '../config/tolgee';
import './LanguageSwitcher.css';

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
          onClick={() => tolgee.changeLanguage(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
