# CodePulse

**Plataforma B2B de auditoría e insights automatizados para repositorios GitHub y APIs.**

Conecta repos o endpoints, ejecuta análisis de salud y genera un informe profesional
(seguridad, calidad, riesgos críticos, fortalezas y sugerencias) listo para demo o portfolio.

## Demo en vivo

**App:** [https://code-pulse-delta.vercel.app](https://code-pulse-delta.vercel.app)

| Ruta | Qué ver |
| --- | --- |
| `/` | Landing pública |
| `/register` · `/login` | Alta e inicio de sesión (email/password o GitHub) |
| `/onboarding` | Crear organización / plan |
| `/dashboard` | Overview, métricas y tendencia de salud |
| `/dashboard/projects` | Conectar repos, analizar, ver score e insights |
| `/invite/[token]` | Aceptar invitación a un equipo |

> En producción (Vercel) el análisis corre **inline** cuando no hay worker BullMQ
> separado. En local podés usar `npm run worker` con Redis para el pipeline asíncrono.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16 (App Router, React 19), Tailwind CSS 3, Tremor + Recharts |
| Auth | Auth.js v5 (Credentials + GitHub OAuth), multi-tenant por organización |
| Backend / Jobs | Node.js + TypeScript, BullMQ + Redis (opcional en Vercel) |
| Base de datos | PostgreSQL + Prisma ORM 6 |
| IA | Vercel AI SDK (`openai` / `anthropic`) con informe estructurado |
| Deploy | Vercel · Neon (Postgres) · Upstash (Redis) |
| Testing | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions |

## Características

- **Auth multi-tenant**: registro, login, onboarding de organización, invitaciones
- **GitHub**: OAuth para listar repos propios + conexión manual por URL/`owner/repo`
- **Análisis**: score 0–100, severidad, informe Markdown (riesgos, seguridad, calidad, fortalezas, sugerencias)
- **Dashboard**: StatCards, gráfico de tendencia, alertas/notificaciones, auditoría global
- **UI limpia para demo**: sin controles decorativos rotos; tema claro/oscuro

## Estructura (resumen)

```
CodePulse/
├── prisma/                  # Schema + migraciones + seed
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # Overview, projects, insights, settings
│   │   ├── login|register|onboarding|invite/
│   │   └── api/             # auth, projects, analysis, github, webhooks, notifications
│   ├── components/          # UI, charts, auth shell, notifications
│   ├── server/
│   │   ├── analysis/        # runAnalysis + enqueue-or-run (inline en Vercel)
│   │   ├── queue/           # BullMQ
│   │   ├── workers/         # Worker opcional (`npm run worker`)
│   │   └── ai/              # generateRepoInsight + prompts/schema
│   ├── lib/                 # prisma, redis, github, auth helpers, safety
│   └── proxy.ts             # Gate de /dashboard (Auth.js)
├── tests/unit/ · e2e/
└── .env.example
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- Redis 6+ (recomendado en local; en Vercel el análisis puede correr sin worker)
- API key OpenAI y/o Anthropic (**opcional**): sin ella el pipeline usa un informe
  determinístico basado en el snapshot del repo/API (sin mostrar “costuras” de mock en la UI)

## Puesta en marcha (local)

1. **Dependencias** (Tremor + React 19):

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Variables de entorno**:

   ```bash
   cp .env.example .env
   ```

   Completá al menos `DATABASE_URL`, `DIRECT_URL` (si usás Neon), `REDIS_URL`,
   `AUTH_SECRET` / `NEXTAUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
   Opcional: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`.

3. **Postgres + Redis** (Docker de ejemplo):

   ```bash
   docker run -d --name codepulse-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=codepulse -p 5432:5432 postgres:16
   docker run -d --name codepulse-redis -p 6379:6379 redis:7
   ```

4. **Migrar y seed**:

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

   El seed está **bloqueado en production** salvo `ALLOW_PROD_SEED=true`.

5. **App (+ worker opcional)**:

   ```bash
   npm run dev       # http://localhost:3000
   npm run worker    # opcional: cola analyze-repo-queue
   ```

6. Flujo rápido: registrate → onboarding → **Conectar repositorio** → **Analizar ahora**.

## Deploy (Vercel)

Variables típicas en el proyecto:

`DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` (`rediss://…` para Upstash, **sin comillas**),
`AUTH_SECRET`, `NEXTAUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`,
`NEXT_PUBLIC_APP_URL`, `GITHUB_CLIENT_*`, `AI_PROVIDER`, `AI_MODEL`, keys de IA opcionales.

Callback de GitHub OAuth:

`https://code-pulse-delta.vercel.app/api/auth/callback/github`

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run worker` | Worker BullMQ |
| `npm run prisma:generate` / `:migrate` / `:studio` / `:seed` | Prisma |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run lint` | ESLint |

## Pipeline de análisis

1. **Conectar** — `createProjectAction` crea el `Project` y dispara análisis.
2. **Ejecutar** — en Vercel: inline (`enqueueOrRunAnalysis`). En local con Redis + worker: cola BullMQ.
3. **Insight** — `generateRepoInsight()` (LLM o fallback determinístico) → Markdown de auditoría.
4. **Persistir** — `AnalysisResult` (`aiScore`, `severity`, `summary`, `aiInsight`, métricas).
5. **UI** — detalle del proyecto + feed `/dashboard/insights`.

## Notas

- **Auth**: Auth.js JWT + Prisma adapter; el proxy solo protege `/dashboard/*`.
- **Seguridad**: redirects seguros, webhooks con HMAC, política de passwords, rate limit de auth, bloqueo SSRF en URLs.
- **Tremor**: Tailwind 3.4 + safelist (no v4) por clases dinámicas de color.

## Licencia

Ver [`LICENSE`](./LICENSE).
