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
| `/dashboard/projects` | Conectar repos, analizar, ver score e historial |
| `/dashboard/projects/[id]/analyses/[resultId]` | Detalle de una auditoría anterior |
| `/dashboard/insights` | Feed de insights con filtros |
| `/dashboard/settings` | Perfil, equipo, webhook de GitHub (URL + secret) |
| `/invite/[token]` | Aceptar invitación a un equipo |

> En producción (Vercel) el análisis corre **inline** cuando no hay worker BullMQ
> separado. En local podés usar `npm run worker` con Redis para el pipeline asíncrono.
> El build de producción ejecuta `prisma migrate deploy` antes de `next build`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16 (App Router, React 19), Tailwind CSS 3, Tremor + Recharts |
| Auth | Auth.js v5 (Credentials + GitHub OAuth), multi-tenant por organización |
| Backend / Jobs | Node.js + TypeScript, BullMQ + Redis (opcional en Vercel) |
| Base de datos | PostgreSQL + Prisma ORM 6 |
| IA | Vercel AI SDK (`openai` / `anthropic` / `google`) con informe estructurado |
| Deploy | Vercel · Neon (Postgres) · Upstash (Redis) |
| Testing | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions |

## Características

- **Auth multi-tenant**: registro, login, onboarding de organización, invitaciones
- **UI responsive**: menú hamburguesa en móvil, tablas → cards, layouts adaptables
- **GitHub**: OAuth para listar repos + conexión manual por URL/`owner/repo`
- **Webhooks GitHub**: push / pull_request disparan análisis automáticamente. En
  **Settings** cada organización copia Payload URL + Secret (`cp_wh_…`) hacia GitHub
- **Análisis enriquecido**: CI/workflows, Dependabot, CODEOWNERS, `package.json`,
  lenguajes, PRs abiertos, licencia y señales de higiene del repo
- **Modo IA visible**: badge **IA en vivo** vs **Heurístico** cuando no hay LLM o falla el proveedor
- **Historial clickeable**: cada corrida abre su informe completo
- **Dashboard**: StatCards, gráfico de tendencia, auditoría global
- **Tema claro/oscuro**

## Estructura (resumen)

```
CodePulse/
├── prisma/                  # Schema + migraciones + seed
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # Overview, projects, insights, settings, analyses
│   │   ├── login|register|onboarding|invite/
│   │   └── api/             # auth, projects, analysis, github, webhooks
│   ├── components/          # UI, charts, auth shell, settings helpers
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
- API key OpenAI, Anthropic o Google Gemini (**opcional**): sin ella (o si el LLM
  falla) el pipeline usa un informe heurístico y lo marca en la UI como **Heurístico**

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
   Opcional: `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`,
   `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY`,
   `AI_PROVIDER`, `AI_MODEL`, `GITHUB_WEBHOOK_SECRET` (fallback de plataforma;
   el secret por organización se gestiona en Settings).

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
7. (Opcional) Webhook: Settings → copiá URL + Secret → GitHub repo → Webhooks
   (`application/json`, eventos Push + Pull requests).

## Deploy (Vercel)

Variables típicas en el proyecto:

`DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` (`rediss://…` para Upstash, **sin comillas**),
`AUTH_SECRET`, `NEXTAUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`,
`NEXT_PUBLIC_APP_URL`, `GITHUB_CLIENT_*`, `AI_PROVIDER`, `AI_MODEL`, keys de IA opcionales.
`GITHUB_WEBHOOK_SECRET` es opcional (fallback); el secret que pegan los usuarios
en GitHub es el de su organización (`cp_wh_…`).

Callback de GitHub OAuth:

`https://code-pulse-delta.vercel.app/api/auth/callback/github`

Webhook Payload URL:

`https://code-pulse-delta.vercel.app/api/webhooks/github`

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js (`build` corre `prisma migrate deploy`) |
| `npm run worker` | Worker BullMQ |
| `npm run prisma:generate` / `:migrate` / `:studio` / `:seed` | Prisma |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run lint` | ESLint |

## Pipeline de análisis

1. **Conectar** — `createProjectAction` crea el `Project` y dispara análisis.
2. **Ejecutar** — en Vercel: inline (`enqueueOrRunAnalysis`). En local con Redis + worker: cola BullMQ.
   También vía webhook GitHub (`/api/webhooks/github`) en push/PR.
3. **Snapshot** — metadata + señales de ingeniería (CI, deps, etc.) o probe de API.
4. **Insight** — `generateRepoInsight()` (LLM o heurística) → Markdown de auditoría + `aiMode`.
5. **Persistir** — `AnalysisResult` (`aiScore`, `severity`, `summary`, `aiInsight`, `aiMode`, métricas).
6. **UI** — detalle del proyecto, historial clickeable e insights.

## Notas

- **Auth**: Auth.js JWT + Prisma adapter; el proxy solo protege `/dashboard/*`.
- **Seguridad**: redirects seguros, webhooks con HMAC (secret de org o de plataforma),
  política de passwords, rate limit de auth, bloqueo SSRF en URLs.
- **Tremor**: Tailwind 3.4 + safelist (no v4) por clases dinámicas de color.

## Licencia

Ver [`LICENSE`](./LICENSE).
