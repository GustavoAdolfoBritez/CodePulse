# CodePulse

**Plataforma de Auditoría e Insights Automatizados para Repositorios/APIs.**

B2B SaaS que conecta repositorios de GitHub o APIs externas, procesa sus datos
en segundo plano, calcula métricas de rendimiento/errores y usa un LLM
(OpenAI GPT-4o o Anthropic Claude 3.5 Sonnet) para generar sugerencias de
optimización automatizadas.

> **Fase 4 completa**: onboarding B2B en `/onboarding`, invitaciones por email con
> aceptación en `/invite/[token]`, listado de repos reales vía GitHub OAuth en el
> modal de conexión (fallback manual si no hay credenciales) y landing pública en `/`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16 (App Router, React 19), Tailwind CSS 3, Tremor + Recharts |
| Backend / Jobs | Node.js + TypeScript, BullMQ sobre Redis |
| Base de datos | PostgreSQL + Prisma ORM 6 |
| IA | Vercel AI SDK (`ai`) + `@ai-sdk/openai` / `@ai-sdk/anthropic` |
| Testing | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions |

## Estructura del proyecto

```
CodePulse/
├── .github/workflows/ci.yml       # Lint + unit tests + e2e (con Postgres/Redis de servicio)
├── prisma/
│   ├── schema.prisma               # User, Organization, Project, AnalysisResult
│   └── seed.ts                     # Datos de ejemplo
├── src/
│   ├── app/
│   │   ├── (dashboard)/            # Route group con layout + sidebar
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       ├── page.tsx                # Overview con StatCards + Tremor AreaChart
│   │   │       ├── projects/
│   │   │       │   ├── page.tsx            # Lista de proyectos + estado/severidad/AI Score
│   │   │       │   ├── [id]/page.tsx       # Detalle: insight actual + historial + Markdown
│   │   │       │   ├── actions.ts          # Server Actions: crear proyecto / re-analizar
│   │   │       │   ├── ConnectRepoDialog.tsx
│   │   │       │   └── AnalyzeButton.tsx
│   │   │       └── insights/page.tsx       # Feed global (último insight por proyecto)
│   │   ├── api/
│   │   │   ├── projects/route.ts       # Crea proyecto y encola el primer análisis
│   │   │   ├── analysis/route.ts       # Encola un Job en "analyze-repo-queue" (BullMQ)
│   │   │   └── webhooks/github/route.ts# Recibe eventos de GitHub
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── charts/PerformanceChart.tsx # Wrapper de Tremor AreaChart
│   │   ├── dashboard/StatCard.tsx
│   │   ├── insights/{SeverityBadge,StatusBadge,ScoreBadge,MarkdownContent}.tsx
│   │   ├── ui/Badge.tsx
│   │   └── layout/{Sidebar,Header}.tsx
│   ├── server/
│   │   ├── queue/{connection,queues}.ts# Cola "analyze-repo-queue"
│   │   ├── workers/analysis.worker.ts  # Worker BullMQ: fetch GitHub/API -> IA -> persistencia
│   │   └── ai/{client,prompts,schema}.ts # generateRepoInsight() (LLM real o mock heurístico)
│   ├── lib/{prisma,redis,github,current-org,utils}.ts
│   ├── types/index.ts
│   └── config/site.ts
├── tests/unit/                     # Vitest + Testing Library
├── e2e/                             # Playwright
├── tailwind.config.ts               # Config + safelist requerido por Tremor
├── vitest.config.ts
├── playwright.config.ts
└── .env.example
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (local, Docker, o instalado nativo en Windows)
- Redis 6+ (local, Docker, o el binario portable de Windows — ver abajo)
- Una API key de OpenAI y/o Anthropic (**opcional**: sin ella, el pipeline de
  IA usa un generador de insights mock basado en heurísticas, así el flujo
  completo funciona igual sin gastar créditos)

## Puesta en marcha

1. **Instalar dependencias** (se usa `--legacy-peer-deps` porque Tremor aún
   declara React 18 como peer dependency, aunque funciona correctamente con
   React 19):

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configurar variables de entorno**:

   ```bash
   cp .env.example .env
   # Editar DATABASE_URL, REDIS_URL, OPENAI_API_KEY / ANTHROPIC_API_KEY, etc.
   ```

3. **Levantar Postgres y Redis.**

   Con Docker (recomendado si está disponible):

   ```bash
   docker run -d --name codepulse-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=codepulse -p 5432:5432 postgres:16
   docker run -d --name codepulse-redis -p 6379:6379 redis:7
   ```

   Sin Docker en Windows (usado para desarrollar/validar este proyecto, sin
   necesitar permisos de administrador para Servicios de Windows):

   ```powershell
   # PostgreSQL: instalar con winget y crear un data dir propio (no requiere admin)
   winget install --id PostgreSQL.PostgreSQL.17
   & "C:\Program Files\PostgreSQL\17\bin\initdb.exe" -D "C:\pgdata17" -U postgres --auth=trust
   # Editar C:\pgdata17\postgresql.conf -> port = 5433 (evita chocar con el servicio por defecto)
   & "C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" -D "C:\pgdata17" -l "C:\pgdata17\server.log" start
   & "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -p 5433 -U postgres codepulse

   # Redis: binario portable, sin instalador/servicio (redis-windows/redis-windows en GitHub)
   # Descargar el .zip "Windows-x64-msys2" de la última release y ejecutar:
   .\redis-server.exe --port 6379
   ```

   Ajusta `DATABASE_URL`/`REDIS_URL` en `.env` según el puerto que uses.

4. **Migrar y sembrar la base de datos**:

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Levantar la app** (Next.js) y, en otra terminal, **el worker** de BullMQ:

   ```bash
   npm run dev       # http://localhost:3000
   npm run worker    # procesa la cola "analyze-repo-queue"
   ```

6. Ir a [`/dashboard/projects`](http://localhost:3000/dashboard/projects),
   click en **"Conectar repositorio"**, pegar un `owner/repo` (p. ej.
   `vercel/next.js`) y confirmar. El proyecto aparece como *Procesando* y,
   cuando el worker termina, se actualiza a *Completado* con su AI Score,
   severidad e insight en Markdown (ver también `/dashboard/insights`).

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run worker` | Worker de BullMQ (background jobs) |
| `npm run prisma:generate` / `:migrate` / `:studio` / `:seed` | Prisma |
| `npm run test` | Vitest (unit/integration) |
| `npm run test:e2e` | Playwright (E2E; hace `build` + `start` automáticamente) |
| `npm run lint` | ESLint |

## Sistema de diseño (UI)

El dashboard usa una estética B2B tipo "Kravio" con soporte completo de
**modo oscuro/claro** (toggle en el pie del sidebar, persistido por
`next-themes`), paleta `zinc` + acentos `indigo`/`emerald`/`rose`, tarjetas
`rounded-2xl` con bordes sutiles, sidebar con secciones en mayúsculas
(`MAIN NAVIGATION`, `ANALYTICS & INSIGHTS`, `SUPPORT`) e iconos de
[Lucide](https://lucide.dev). Los componentes clave:

- `src/components/theme/{ThemeProvider,ThemeToggle}.tsx`
- `src/components/layout/{Sidebar,Header}.tsx`
- `src/components/dashboard/StatCard.tsx` (con mini-sparkline SVG)
- `src/components/charts/{PerformanceChart,Sparkline}.tsx`

Los tokens de color de Tremor (`tremor-*` / `dark-tremor-*` en
`tailwind.config.ts`) se remapearon de `gray` a `zinc` para que las Cards y
el `AreaChart` de Tremor respeten la misma paleta que el resto de la UI.

## Pipeline de análisis (Fase 1)

1. **Conectar** — el formulario/modal en `/dashboard/projects` llama a la
   Server Action `createProjectAction` (`src/app/(dashboard)/dashboard/projects/actions.ts`),
   que crea el `Project` y encola un Job en `analyze-repo-queue`. El botón
   **"Analizar ahora"** (en la lista y en el detalle) hace lo mismo vía
   `triggerAnalysisAction` para re-analizar un proyecto existente. La misma
   lógica también está expuesta como Route API (`POST /api/projects`,
   `POST /api/analysis`) para integraciones externas/webhooks.
2. **Procesar en background** — `src/server/workers/analysis.worker.ts`
   (proceso separado, `npm run worker`) consume la cola. Para proyectos
   `GITHUB_REPO` usa Octokit (`src/lib/github.ts`) para traer metadata del
   repo, el listado de archivos raíz y los últimos commits; para
   `API_ENDPOINT` hace un ping real al `apiUrl` y mide latencia/status.
3. **Generar el Insight con IA** — `generateRepoInsight()`
   (`src/server/ai/client.ts`) manda ese contexto al modelo configurado
   (`AI_PROVIDER`/`AI_MODEL`, vía Vercel AI SDK + `generateObject` con un
   schema Zod: `score`, `severity`, `summary`, `suggestions` en Markdown).
   **Si no hay `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` configurada (o la
   llamada falla), cae automáticamente a un generador mock** que aplica
   heurísticas explicables (README/tests/CI/lockfile presentes, issues
   abiertas, antigüedad del último push, etc.) sobre los mismos datos —
   así el pipeline completo es demostrable sin credenciales.
4. **Persistir** — el resultado se guarda en `AnalysisResult` (incluye
   `aiScore`, `severity`, `summary`, `aiInsight` en Markdown, `rawMetrics`
   con los datos crudos obtenidos, `errorCount`, `latencyMsP95`).
5. **Mostrar en la UI** — `/dashboard/projects` (tabla con estado/severidad/
   score), `/dashboard/projects/[id]` (insight actual + historial completo)
   y `/dashboard/insights` (feed global del último insight por proyecto),
   todos renderizando el Markdown con `react-markdown` + `remark-gfm`.

## Notas de arquitectura

- **Jobs asíncronos**: la cola vive en `src/server/queue/queues.ts`
  (`analyze-repo-queue`); el trabajo pesado nunca corre en el request HTTP,
  siempre en `src/server/workers/analysis.worker.ts`, un proceso separado
  que se puede escalar de forma independiente.
- **IA**: `src/server/ai/client.ts` abstrae el proveedor (OpenAI/Anthropic)
  detrás de `generateRepoInsight()`, controlada por `AI_PROVIDER`/`AI_MODEL`,
  con fallback mock determinístico (ver arriba).
- **Tailwind + Tremor**: se usa Tailwind CSS **3.4** (no v4) porque Tremor
  v3 construye varias clases de color dinámicamente en runtime
  (`bg-${color}-${shade}`); esto requiere el `content`/`safelist` clásico de
  Tailwind v3 documentado por Tremor. Ver `tailwind.config.ts`.
- **Multi-tenant**: todos los modelos (`User`, `Project`, `AnalysisResult`)
  cuelgan de `Organization`, pensado para aislar datos por cliente B2B.

## Próximos pasos sugeridos

- Autenticación (NextAuth/Clerk) y scoping de sesión por `Organization`
  (hoy `src/lib/current-org.ts` usa la primera organización de la base).
- Integración vía GitHub App/OAuth (en vez de API pública sin token) para
  subir el rate limit y poder leer repos privados.
- Ingesta de logs reales de APIs externas (webhook o SDK) hacia el mismo
  pipeline de `AnalysisResult`, más allá del ping de latencia actual.
- Notificaciones (email/Slack) cuando un análisis detecta severidad
  `HIGH`/`CRITICAL`.
- Autenticación de servicio a servicio para el worker (actualmente comparte
  `.env` con la app web).
