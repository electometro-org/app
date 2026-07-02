# Electómetro

El **Electómetro** es una herramienta digital de voto informado, inspirada en el
modelo alemán Wahl-o-Mat (**bpb 2024**), pero adaptada al contexto político, institucional y social
del país.  

Su objetivo es sencillo: ayudar a los votantes a identificar qué candidaturas se alinean mejor con
sus posiciones y valores, mediante una experiencia interactiva, personalizada y fácil de usar.  

Con ello buscamos empoderar a la ciudadanía con información clara y accesible, visibilizar
propuestas políticas y fortalecer la legitimidad del proceso democrático.

## ¿Cómo funciona?

* Los/las votantes responden un cuestionario de 10 a 20 tesis sobre temas clave del debate
nacional.  

* Para cada tesis, el/la votante evalúa si está de en completo desacuerdo, neutral o en completo acuerdo con la tesis. 
Además, podrá seleccionar si el tema le parece de alta, mediana o baja importancia.

*  En base a la respuesta de el/la votante, así como sus preferencias de importancia, se le
informará sobre su cercanía programática e ideológica a los distintos partidos y candidaturas.

*  Además, se incluirá información relevante de las candidaturas, como antecedentes penales o
investigaciones por corrupción, historial partidario, niveles educativos, así como bienes e
inmuebles declarados.

## Características

### 📱 Experiencia de Usuario
- Diseño responsive (móvil y escritorio)
- Navegación fluída entre preguntas únicas
- Sistema de pesos para preguntas importantes
- Formulario demográfico opcional (género, edad, educación, región)
- Detalles ampliados de candidatos/partidos

### 📊 Análisis de Resultados
- Cálculo de similitud con partidos políticos
- Cálculo de similitud con candidatos presidenciales
- Partición de resultados según número mínimo de preguntas comparadas
- Desempate aleatorio para evitar sesgos
- Visualización de coincidencias por pregunta individual
- **Gráficos de Tendencias Agregadas (TBA)** 

### 💾 Guardar y Compartir
- Codificación de resultados en una **frase mnemónica** (p.ej. `sol-luna-rio-...`)
- Restauración vía URL (`#/?r=<frase>`) o ingreso manual
- Detección de cambios de versión del cuestionario al restaurar

### 🗳️ Multi-Vuelta
- Soporte para elecciones con segunda vuelta (filtrado de candidatos/partidos por vuelta)
- Selección de vuelta en la pantalla de introducción

### 🌍 Internacionalización (i18n)
- Soporte multiidioma mediante [Tolgee](https://tolgee.io/)
- Cambio de idioma dinámico sin recargar la página
- Idiomas disponibles:
  - Español
  - Quechua
  - Aymara

### 🔒 Seguridad y Anti-Fraude
- Verificación CAPTCHA antes de enviar respuestas (Turnstile, con hCaptcha como
  fallback para navegadores antiguos)
- Identificación única de dispositivos mediante [fpscanner](https://www.npmjs.com/package/fpscanner)
- Validación de cookies `cf_clearance` con fingerprints
- **Rate limiting**: Protección contra envíos masivos automatizados

### 📈 Analytics
- Integración con [Trench.js](https://trench.dev/) para análisis de uso
- Seguimiento de eventos respetando consentimiento del usuario
- Métricas de finalización de cuestionarios
- Análisis demográfico agregado

---

## 🏗️ Stack

### Frontend (SPA)
- ⚛️ **React 18**
- 🚀 **Vite** (build y dev server)
- 🌐 **React Router** (HashRouter) para navegación
- 🗣️ **Tolgee** para internacionalización
- 🧩 **react-grid-layout** para el sistema de widgets

### **Backend (Serverless)**:
- ☁️ **Cloudflare Workers** (sirve los assets estáticos de la SPA y la API)
- 🗄️ **Supabase** (PostgreSQL) para almacenamiento
- 📦 **Cloudflare R2** (S3 object storage) para traducciones y datos de votación
- 🔑 **Cloudflare KV** para vinculación fingerprint-cookie

### **Seguridad**:
- 🔐 **Cloudflare Turnstile** (CAPTCHA) + **hCaptcha** (fallback navegadores antiguos)
- 🖐️ **fpscanner** (device fingerprinting)
- 🛡️ **Row Level Security** en Supabase

### **Análisis y Monitoreo**:
- 📊 **Trench.js** (analytics con consentimiento)
- 📈 Supabase Analytics (métricas del lado del servidor)

---

## 📚 Documentación

Documentación técnica para desarrolladores en [`docs/`](docs/):

| Documento | Contenido |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura general: flujo de fases, estado, cálculo de resultados, i18n, analytics |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, variables de entorno, scripts, pipeline de build, deploy |
| [docs/ELECTIONS.md](docs/ELECTIONS.md) | Referencia de configuración de elecciones, formatos de datos, cómo agregar una elección |
| [docs/WIDGETS.md](docs/WIDGETS.md) | Sistema de widgets (layout, docking, persistencia) |
| [docs/BACKGROUNDS.md](docs/BACKGROUNDS.md) | Sistema de fondos configurables |
| [docs/SUBMODULES.md](docs/SUBMODULES.md) | Submódulos, symlinks e interfaz de la API backend |
| [CODE_DEBT_AUDIT.md](CODE_DEBT_AUDIT.md) | Deuda técnica conocida y hacks de compatibilidad intencionales |

---

## 💻 Instalación y Desarrollo

### Prerrequisitos

- Node.js >= 18
- `npm`
- Cuenta de Cloudflare (para Workers, KV, R2)
- Cuenta de Supabase
- Cuenta de Tolgee (opcional, para gestionar traducciones)

### Configuración Local

1. **Clonar el repositorio**:
```bash
git clone https://github.com/electometro-org/app.git "electometro-app"
cd electometro-app
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:

- Copiar `.env.example` a nuevo archivo `.env`
- Copiar `.env.development.example` a nuevo archivo `.env.development`
- Copiar `.env.local.example` a nuevo archivo `.env.local`
- Completar valores de variables necesarias

> **Nota (equipo con acceso a los repos privados)**: los pasos 4 y 5 se resuelven con los
> submódulos ya configurados en `.gitmodules` y tres symlinks:
> ```bash
> git submodule update --init
> ln -s ./external/peru-assets/app/i18n   ./i18n
> ln -s ./external/peru-assets/app/public ./public
> ln -s ./external/cf-workers/peru_2026/wrangler ./wrangler
> ```
> Ver [docs/SUBMODULES.md](docs/SUBMODULES.md). Las opciones manuales siguen siendo válidas
> para quien no tenga acceso.

4. **Configurar carpeta `public`**:

El proyecto requiere una carpeta `public` con los assets de la elección. Esta carpeta **no está incluida en el repositorio** y debe ser proporcionada por separado.

**Estructura requerida**:
```
public/
├── index.html              # Página principal (usar index.html.example como plantilla)
└── static/                 # Assets estáticos (copiados a dist/ en build)
    ├── favicon.svg
    ├── i18n/               # Archivos de traducción (OPCIONAL)
    │   ├── es.json
    │   └── qu.json
    ├── {election_id}/      # Assets específicos de la elección (ej: peru_2026/)
    │   ├── party_logos/    # Logos de partidos políticos
    │   └── favicon.svg     # Favicon específico de la elección
    └── combined_votes_*.json  # Datos de votación generados por scripts (OPCIONAL DURANTE DESARROLLO)
```

**Opciones de configuración**:

- **Opción A**: Crear la carpeta `public` manualmente siguiendo la estructura anterior
- **Opción B**: Usar un submódulo git con los assets:
  ```bash
  # Ejecutar en la raiz del proyecto
  git submodule add <url-repositorio-assets> external/assets
  ln -s ./external/assets/app/public ./public
  ```

> **Nota**: El archivo `index.html.example` en la raíz del proyecto sirve como plantilla. Cópialo a `public/index.html` y ajusta los valores de CSP y meta tags según tu dominio.

5. **Configurar carpeta `wrangler`**:

El proyecto requiere una carpeta `wrangler` con la configuración del Worker de Cloudflare. Esta carpeta **no está incluida en el repositorio** y debe ser proporcionada por separado.

**Estructura requerida**:
```
wrangler/
├── wrangler.toml           # Configuración principal del Worker
└── worker/                 # Código del Worker (opcional, si se separa del src/)
    └── api.ts
```

**Opciones de configuración**:

- **Opción A**: Crear la carpeta `wrangler` manualmente:
  ```bash
  # Ejecutar en la raiz del proyecto
  mkdir -p wrangler
  cp wrangler.toml.example wrangler/wrangler.toml
  # Editar wrangler/wrangler.toml con tus valores
  ```

- **Opción B**: Usar un submódulo git (si los assets incluyen configuración):
  ```bash
  git submodule add <url-repositorio-workers> external/cloudflare-worker
  ln -s ./external/cloudflare-worker/wrangler ./wrangler
  ```

> La documentación completa de Wrangler se encuentra [aquí](https://developers.cloudflare.com/workers/wrangler/configuration/)

6. **Ejecutar migraciones de base de datos**:
```bash
# En Supabase SQL Editor, ejecutar:
# 1. migration.sql
# 2. security.sql
```

7. **Iniciar servidor de desarrollo**:
```bash
# Hot reloading activado. Ideal para desarollo continuo
npm run dev
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia Vite dev server

# Build
npm run build            # Build de producción (incluye bundles legacy)
npm run build-dev        # Build de desarrollo

# Preview
npm run preview          # Build dev + wrangler dev (Worker + SPA en local, HTTPS)
npm run preview-qa       # Igual, con el entorno QA del Worker

# Deploy
npm run deploy           # Build + wrangler deploy (producción)
npm run deploy-qa        # Build + wrangler deploy (entorno QA)

# Linting
npm run lint             # Ejecuta ESLint
```

---

## 🚀 Lanzamiento

### Cloudflare Workers (assets estáticos + API)

El proyecto se despliega como un único **Cloudflare Worker** que sirve tanto el frontend
estático (assets binding con fallback SPA) como los endpoints de la API. Detalles del
pipeline de build en [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

**Pasos de despliegue**:

1. **Configurar secretos en Cloudflare** (ver lista completa en el repo privado del Worker):
```bash
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SUPABASE_ANON_KEY
```

2. **Desplegar Worker** (build + deploy):
```bash
npm run deploy       # producción
npm run deploy-qa    # entorno QA
```

3. **Configurar dominio personalizado**:
  - La ruta del Worker se define en `wrangler/wrangler.toml` (p.ej. `decide.pe/electometro*`)
  - El `BASE_PATH` del Worker debe coincidir con el `base` de `vite.config.js`

4. **Configurar R2 Bucket para traducciones**:
```bash
# Crear bucket
wrangler r2 bucket create electometro-i18n

# Subir archivos de traducción (NO recomendado)
wrangler r2 object put electometro-i18n/es.json --file=public/i18n/es.json
wrangler r2 object put electometro-i18n/qu.json --file=public/i18n/qu.json

# Tonglee mantiene el bucket actualizado automaticamente
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este proyecto busca fortalecer la democracia mediante tecnología abierta.

### Proceso de Contribución

1. **Fork el repositorio**
2. **Crea una rama para tu feature**:
   ```bash
   git checkout -b feat/nueva-caracteristica
   ```
3. **Realiza tus cambios** siguiendo las guías de estilo
4. **Ejecuta los tests y linter**:
   ```bash
   npm run lint
   ```
5. **Commit con mensaje descriptivo**:
   ```bash
   git commit -m "feat: agregar gráfico de tendencias semanales"
   ```
6. **Push a tu fork**:
   ```bash
   git push origin feat/nueva-caracteristica
   ```
7. **Abre un Pull Request** describiendo los cambios

### Guías de Estilo

- **JavaScript**: Seguir ESLint config del proyecto
- **Commits**: Usar [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` nueva funcionalidad
  - `fix:` corrección de bugs
  - `docs:` cambios en documentación
  - `refactor:` refactorización sin cambios funcionales
  - `style:` cambios de formato (sin afectar código)
  - `test:` agregar o modificar tests
  - `chore:` tareas de mantenimiento

### Áreas donde Contribuir

- 🌍 **Traducciones**: Agregar nuevos idiomas (Aymara, Inglés, etc.)
- 🎨 **Diseño**: Mejorar UX/UI
- 🔒 **Seguridad**: Reforzar medidas anti-fraude
- 📊 **Visualizaciones**: Nuevos tipos de gráficos
- 🧪 **Testing**: Agregar tests unitarios y de integración
- 📱 **Accesibilidad**: Mejorar compatibilidad con lectores de pantalla
- 🐛 **Bug fixes**: Reportar y solucionar bugs

---

## 🗓️ Roadmap

### Q1/1 2026
- ✅ Sistema de internacionalización (Tolgee)
- ✅ Soporte para Quechua
- ✅ Backend de traducciones en Cloudflare R2
- 🔄 Migración completa de strings hardcodeados a translation keys

### Q1/2 2026
- ✅ **Fondos dinámicos por pregunta** (sistema de fondos: sólido, imagen, slideshow, gradiente)
- ✅ **Guardar y compartir resultados** (frase mnemónica + URL)
- ✅ **Soporte multi-vuelta** (segunda vuelta con filtrado de candidatos)
- 🏗️ **Refactorización**: Modularización del código
  - Extracción de modelos de dominio
  - Servicios de negocio separados
  - Arquitectura en capas
  - Mejor testabilidad

### Planificado
- 🧪 Suite completa de tests (unit, integration, e2e)

### Futuro
- 📊 **Gráficos de tendencias agregadas**
- 📈 Dashboard de estadísticas en tiempo real
- 📊 Visualizaciones demográficas (con privacidad)
- 🌐 Expansión a más países de Latinoamérica

---

## 🙏 Agradecimientos

- **Bundeszentrale für politische Bildung (bpb)** por el modelo Wahl-o-Mat
- **Comunidad open-source** por las herramientas utilizadas
- **Contribuidores** que hacen posible este proyecto
- **Votantes** que utilizan la herramienta para tomar decisiones informadas

---

## 📞 Contacto

- **Sitio web**: [electometro.org](https://electometro.org)
- **Repositorio**: [github.com/electometro-org/app](https://github.com/electometro-org/app)
- **Issues**: [github.com/electometro-org/app/issues](https://github.com/electometro-org/app/issues)

---

**Hecho con ❤️ para fortalecer la democracia en Latinoamérica**