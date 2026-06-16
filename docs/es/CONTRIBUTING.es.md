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
```

## Ramas

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
- Sigue `docs/CONVENTIONS.md` para nombres y carpetas.
- Componentes React: `PascalCase.jsx`.
- Hooks: `useSomething.js`.
- Servicios: `somethingService.js`.
- Contextos: `SomethingContext.jsx`.
- Utilidades/configuracion/constantes: `camelCase.js`.
- Prefiere servicios y utilidades puras para la logica testeable.
- Usa registros para elecciones, widgets y fondos.
- Las cadenas visibles para usuarios deben pasar por Tolgee.

## Pruebas

Todavia no hay suite automatizada. Mientras tanto, verifica manualmente el flujo que cambias:
intro, quiz, importancia de temas, demografia, resultados y restauracion con `?r=`.

Los primeros tests recomendados son para `src/services/`, `src/utils/` y
`src/constants/answerMappings.js`.

## Pull Requests

1. Crea una rama enfocada.
2. Haz cambios pequenos y revisables.
3. Ejecuta lint y un build para tu target.
4. Abre un PR con titulo claro, descripcion, capturas si hay UI y notas de configuracion.
5. Para problemas de seguridad, usa `SECURITY.md`; no abras issues publicos.
