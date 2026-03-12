import { Tolgee, DevTools, FormatSimple, BackendFetch } from "@tolgee/react";

// Use *-qa languages in dev/QA, production languages in PROD
const useQaTranslations = import.meta.env.VITE_TOLGEE_QA_TRANSLATIONS === 'true';

export const esLang = useQaTranslations ? 'es-qa' : 'es';
export const quLang = useQaTranslations ? 'qu-qa' : 'qu';
export const ayLang = useQaTranslations ? 'ay-qa' : 'ay';

const getStaticData = {
    [esLang]: useQaTranslations
        ? () => import("../i18n/es-qa.json").then(m => m.default)
        : () => import("../i18n/es.json").then(m => m.default),
    [quLang]: useQaTranslations
        ? () => import("../i18n/qu-qa.json").then(m => m.default)
        : () => import("../i18n/qu.json").then(m => m.default),
    [ayLang]: useQaTranslations
        ? () => import("../i18n/ay-qa.json").then(m => m.default)
        : () => import("../i18n/ay.json").then(m => m.default),
};

export const tolgee = Tolgee()
  .use(DevTools())
  .use(FormatSimple())
  .use(BackendFetch({
      prefix: `${import.meta.env.VITE_I18N_URL}`,
      fallbackOnFail: true,
      timeout: 5000,
      getData: async response => {
          if (!response.ok) {
              console.warn('Tolgee: Network response was not ok, using static translations');
              throw new Error('Network response was not ok');
          }
          return response.json();
      }
  }))
  .init({
    apiUrl: import.meta.env.VITE_TOLGEE_API_URL,
    apiKey: import.meta.env.VITE_TOLGEE_API_KEY,
    defaultLanguage: esLang,
    availableLanguages: [esLang, quLang, ayLang],
    fallbackLanguage: esLang,
    staticData: getStaticData
  });