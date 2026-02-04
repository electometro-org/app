import React from 'react';
import { useTranslate, useTolgee } from '@tolgee/react';

export default function LanguageSwitcher() {
  const { t } = useTranslate();
  const tolgee = useTolgee(['language']);

  const changeLanguage = (lang) => {
    tolgee.changeLanguage(lang);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', padding: '10px' }}>
      <button
        onClick={() => changeLanguage('es')}
        style={{
          fontWeight: tolgee.getLanguage() === 'es' ? 'bold' : 'normal',
          padding: '5px 10px'
        }}
      >
        {t('languages.spanish')}
      </button>
      <button
        onClick={() => changeLanguage('qu')}
        style={{
          fontWeight: tolgee.getLanguage() === 'qu' ? 'bold' : 'normal',
          padding: '5px 10px'
        }}
      >
        {t('languages.quechua')}
      </button>
    </div>
  );
}

// Example usage in your components:
// import { useTranslate } from '@tolgee/react';
//
// function MyComponent() {
//   const { t } = useTranslate();
//
//   return (
//     <div>
//       <h1>{t('common.loading')}</h1>
//       <button>{t('common.submit')}</button>
//     </div>
//   );
// }