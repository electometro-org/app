import { Tolgee, DevTools, FormatSimple, BackendFetch } from "@tolgee/react";

export const tolgee = Tolgee()
  .use(DevTools())
  .use(FormatSimple())
  .use(BackendFetch({ prefix: '/ab1c998a78a47994cdf7e70f93bc5e9c'}))
  .init({
    apiUrl: import.meta.env.VITE_TOLGEE_API_URL,
    apiKey: import.meta.env.VITE_TOLGEE_API_KEY,
    defaultLanguage: 'es',
    availableLanguages: ['es', 'qu', 'ay'],
    fallbackLanguage: 'es',
  });