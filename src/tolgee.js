import { Tolgee, DevTools, FormatSimple, BackendFetch } from "@tolgee/react";


const getStaticData = {
    es: () => import("../i18n/es.json").then(m => m.default),
    qu: () => import("../i18n/qu.json").then(m => m.default),
    ay: () => import("../i18n/ay.json").then(m => m.default),
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
    defaultLanguage: 'es',
    availableLanguages: ['es', 'qu', 'ay'],
    fallbackLanguage: 'es',
    staticData: getStaticData
  });