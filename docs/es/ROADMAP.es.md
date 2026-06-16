# Hoja de Ruta

Esta hoja de ruta refleja el estado actual del repositorio en la version `0.2.1`.

## Estado Actual

Electometro incluye:

- configuracion multi-eleccion en `src/elections/`;
- flujos de primera y segunda vuelta;
- resultados para partidos y candidaturas presidenciales;
- i18n con Tolgee, con espanol y quechua conectados;
- carga de datos electorales desde JSON externo;
- fondos dinamicos y registro de widgets;
- URLs compartibles mediante frases mnemonicas;
- envio opcional hacia Cloudflare Workers y Supabase; un workflow menciona posible migracion DNS a
  Vercel, pero la configuracion de Vercel no esta versionada en este checkout.

## Corto Plazo

- Agregar Vitest y cubrir primero modulos puros: `resultsService`, `quizService`,
  `submissionService`, `mnemonicCodec`, `versionUtils` y `answerMappings`.
- Mantener secretos fuera de archivos de configuracion versionados. Si vuelve la configuracion de
  Vercel, cargar claves como `fpscanner` mediante secretos de plataforma.
- Agregar CI para lint, build y pruebas.
- Mantener alineada la licencia entre `LICENSE`, `package.json` y `package-lock.json`.
- Activar tareas utiles de Lefthook para lint y mensajes de commit.

## Mediano Plazo

- Dividir `QuizContext.jsx` en modulos enfocados para envio, fingerprint, tema, flujo y resultados.
- Introducir adaptadores pequenos alrededor de `fetch`.
- Completar la organizacion descrita en `docs/CONVENTIONS.md`.
- Documentar los contratos de los submodulos `external/*`.

## Largo Plazo

- Publicar una guia estable para agregar paises, elecciones, widgets, fondos y formatos de datos.
- Agregar fixtures de regresion para versiones reales de datos electorales.
- Definir un proceso de release.

## Deuda Tecnica

- Mantener `src/hooks/useQuiz.js` como unica implementacion del hook de quiz.
- Reducir responsabilidades de `QuizContext.jsx`.
- Agregar pruebas automatizadas.
- Agregar CI de lint/build/test.
- Evitar claves en configuracion versionada, especialmente si vuelve la configuracion de Vercel.
- Activar Lefthook.
- Mantener alineada la licencia Apache-2.0 y completar otros metadatos del paquete.
- Normalizar carpetas, modulos sueltos y nombres de componentes.
