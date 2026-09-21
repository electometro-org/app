# Electometro

> Idioma: [English canonical](../../README.md) · Espanol

Electometro es una **Voting Advice Application (VAA)**: un cuestionario interactivo inspirado en el
modelo Wahl-o-Mat de la bpb alemana. Ayuda a las personas votantes a comparar sus posiciones con las
de partidos y candidaturas presidenciales.

El objetivo es dar informacion clara y accesible para tomar un voto informado, visibilizar programas
politicos y fortalecer la legitimidad democratica.

Despliegues: [electometro.org](https://electometro.org) ·
[electometro.decide.pe](https://electometro.decide.pe).

## Como Funciona

1. La persona responde tesis politicas con a favor, neutral o en contra.
2. Puede marcar temas como muy importantes para aumentar su peso.
3. La app calcula cercania programatica con partidos y candidaturas.
4. Los resultados muestran comparaciones por pregunta.
5. El resultado puede compartirse con una frase mnemonica en el parametro `?r=`.

En las **elecciones regionales** la persona elige primero una region; el cuestionario y las candidaturas
(solo candidaturas regionales, sin partidos) dependen de esa region.

## Funcionalidades

- Diseno responsive para movil y escritorio.
- Flujo de quiz con importancia por temas.
- Resultados ponderados para partidos y candidaturas.
- Soporte multi-vuelta.
- Elecciones regionales: selector de region, cuestionario y candidaturas por region.
- Se puede deseleccionar una respuesta haciendo clic en ella otra vez.
- Pantalla del quiz compacta y fluida: los tamanos se adaptan al viewport.
- i18n con Tolgee.
- Fondos dinamicos y sistema de widgets.
- CAPTCHA, fingerprint, honeypot y validaciones de base de datos para envios.
- Analytics con consentimiento.

## Desarrollo

Requisitos:

- Node.js >= 18 y `npm`.
- Acceso a los assets electorales en `public/`.
- Supabase y Cloudflare/Vercel si vas a probar envio o despliegue.

```bash
git clone --recurse-submodules https://github.com/electometro-org/app.git electometro-app
cd electometro-app
npm install
cp .env.example .env
cp .env.development.example .env.development
cp .env.local.example .env.local
npm run dev
```

Para Cloudflare, crea `wrangler/wrangler.toml` desde `wrangler.toml.example`. Ejecuta las migraciones
SQL en Supabase: `db/migration.sql` y luego `db/security.sql`. Para elecciones regionales ejecuta ademas
`db/regional.sql` (una sola vez, **antes** de desplegar un Worker que envie `region_id`) y, opcionalmente,
`db/regional_views.sql`.

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | Servidor Vite local |
| `npm run build` | Build de produccion |
| `npm run lint` | ESLint |
| `npm run deploy` | Build y despliegue con Wrangler |

## Estructura

- `src/elections/`: configuraciones de elecciones.
- `src/hooks/`: hooks como `useQuiz`.
- `src/contexts/`: proveedores de estado global.
- `src/services/`: logica de resultados, quiz y envio.
- `src/utils/`: utilidades como mnemonicos y versiones.
- `src/widgets/`: sistema de widgets.
- `db/`: migraciones y seguridad de Supabase.
- `docs/`: documentacion del proyecto.

Consulta la discusion *Conventions* en [GitHub Discussions → Docs](https://github.com/electometro-org/app/discussions/categories/docs) para convenciones de nombres y carpetas.

## Configuracion

Las variables principales viven en `.env.example`: analytics, Turnstile, hCaptcha,
`VITE_I18N_URL`, `VITE_ELECTIONS_DATA_URL`, `VITE_ELECTION_ID` y flags de branding/intro.

Orden de carga de Vite (los ultimos sobrescriben a los primeros): `.env` → `.env.local` →
`.env.[modo]` (p. ej. `.env.development`) → `.env.[modo].local`. Las variables reales del shell
tienen prioridad sobre todos los archivos. Wrangler tambien lee `.env.local` en desarrollo local y sus
valores **sobrescriben los `[vars]` de `wrangler.toml`** (p. ej. `ENVIRONMENT=qa`). Si existe
`.dev.vars`, Wrangler usa ese archivo e ignora los `.env*`.

## Elecciones regionales

`peru_regional_2026` reutiliza el aspecto, los assets y los widgets de `peru_2026`, pero funciona por region.
Se activa con `VITE_ELECTION_ID=peru_regional_2026` (su config tiene `enabled: false`).

- **Datos:** un unico JSON compacto (`combined_votes_peru_regions_2026_compact.json`) con
  `{ version, regions: { r1: { id, name, quiz, candidates } } }`. Los textos de preguntas y temas van
  en linea (no son claves de Tolgee), por lo que no se traducen; los textos de la interfaz si.
- **Sube `version` cada vez que cambie el quiz de una region:** las respuestas guardadas se almacenan por
  posicion.
- **Mnemonico:** la frase empieza con una palabra que codifica la region (`r<N>` → palabra *N*, hasta 255).
- **Envio:** el payload incluye `region_id`; el Worker lo valida y guarda las respuestas regionales en una
  tabla aparte (`db/regional.sql`).
- **Logos:** `party_logos/<slug>.{png,jpg,jpeg,svg}`, con el slug del nombre exacto del partido en el JSON.
- **Ajuste del layout del quiz:** variables CSS `--q-*` en `src/elections/peru_2026.css` (por ejemplo
  `document.documentElement.style.setProperty('--q-question-scale', 0.8)` para probar en el navegador).
  Los detalles estan en el [README](../../README.md#regional-elections) y en
  [ADR 0003](../DECISIONS/0003-regional-elections.md).

## Hoja de Ruta

La hoja de ruta vive en ROADMAP.

## Contribuir

Lee [CONTRIBUTING.es.md](CONTRIBUTING.es.md), [SECURITY.md](../../SECURITY.md) y
[CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md).

## Licencia

Electometro esta licenciado bajo [Apache License 2.0](../../LICENSE). `package.json` y
`package-lock.json` declaran `"license": "Apache-2.0"`.
