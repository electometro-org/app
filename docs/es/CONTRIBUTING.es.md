# Contribuir a Electometro

> Idioma: [English canonical](../../CONTRIBUTING.md) · Espanol

Electometro es una Voting Advice Application de codigo abierto. Esta guia resume como preparar el
entorno, que convenciones seguir y como enviar cambios.

Al participar aceptas el [Codigo de Conducta](../../CODE_OF_CONDUCT.md).

## Entorno Local

```bash
git clone --recurse-submodules https://github.com/electometro-org/app.git electometro-app
cd electometro-app
npm install
cp .env.example .env
cp .env.development.example .env.development
cp .env.local.example .env.local
npm run dev
```

El directorio `public/` y la configuracion `wrangler/` pueden venir de submodulos o archivos locales.
Consulta el [README en espanol](README.es.md).

Antes de abrir un PR:

```bash
npm run lint
npm test
```

## Ramas

Crea tu rama a partir de **`v1`** (la rama de desarrollo activa — `main` es legado y sera retirada).
Usa ramas del tipo `tipo/descripcion-corta`:

| Prefijo | Uso |
| --- | --- |
| `feat/` | Nuevas funcionalidades |
| `fix/` | Correcciones |
| `docs/` | Documentacion |
| `refactor/` | Reorganizacion sin cambio funcional |
| `chore/` | Mantenimiento |

## Commits

Usamos Conventional Commits:

```text
<tipo>(<scope opcional>): <descripcion>
```

Tipos comunes: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`.

## Estandares de Codigo

- Sigue ESLint: `npm run lint`.
- Sigue la discusion *Conventions* ([GitHub Discussions → Docs](https://github.com/electometro-org/app/discussions/categories/docs)) para nombres y carpetas.
- Componentes React: `PascalCase.jsx`.
- Hooks: `useSomething.js`.
- Servicios: `somethingService.js`.
- Contextos: `SomethingContext.jsx`.
- Utilidades/configuracion/constantes: `camelCase.js`.
- Prefiere servicios y utilidades puras para la logica testeable.
- Usa registros para elecciones, widgets y fondos.
- Las cadenas visibles para usuarios deben pasar por Tolgee.

## Pruebas

El proyecto tiene una suite de **Vitest** en `tests/` que cubre los modulos puros (`src/services/`,
`src/utils/`, `src/constants/`); Vistas, hooks y contextos aún no están cubiertos.

- `npm test` debe pasar antes de cada PR (`npm run test:watch` durante el desarrollo).
- **La logica pura nueva o modificada incluye sus tests en el mismo PR.**
- Los cambios de UI se verifican manualmente: intro, quiz, importancia de temas, demografia,
  resultados y restauracion con `?r=`.

## Documentacion

1. **Regla de lockstep.** Si tu PR cambia una *interfaz* (config de eleccion, formato de datos,
   API, variables de entorno, convenciones, estructura de tests), actualiza el documento que la
   describe **en el mismo PR**. Los reviewers lo exigen igual que un test faltante. La tabla de
   correspondencias esta en la [version canonica en ingles](../../CONTRIBUTING.md#documentation).
2. **Regla de altitud.** Los docs describen estructura y contratos, no detalle volatil (nada de
   conteos de lineas ni valores exactos que cambian con cada refactor — enlaza al codigo).

El ingles es canonico; si cambias un doc con contraparte en `docs/es/`, refleja el cambio aqui
(o indicalo en el PR para que un maintainer lo haga).

## Pull Requests

1. Crea una rama enfocada a partir de `v1`.
2. Haz cambios pequenos y revisables.
3. Ejecuta lint, tests y un build para tu target.
4. Abre un PR contra `v1` con titulo claro, descripcion, capturas si hay UI y notas de configuracion.
5. Para problemas de seguridad, usa `SECURITY.md`; no abras issues publicos.
