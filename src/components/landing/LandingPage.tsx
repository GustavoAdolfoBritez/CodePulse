import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  FolderGit2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { siteConfig } from "@/config/site";

const features = [
  {
    icon: Sparkles,
    title: "Monitoreo con IA",
    description:
      "Analiza commits, estructura y métricas de salud con insights accionables generados por LLM.",
  },
  {
    icon: BellRing,
    title: "Jobs asíncronos con BullMQ",
    description:
      "Auditorías en background con Redis. Escala análisis sin bloquear tu dashboard ni tu CI.",
  },
  {
    icon: Building2,
    title: "Soporte multi-tenant",
    description:
      "Organizaciones aisladas, roles por equipo e invitaciones por email para colaboración B2B segura.",
  },
  {
    icon: Shield,
    title: "Alertas proactivas",
    description:
      "Notificaciones automáticas cuando la severidad o el score de salud cruzan umbrales críticos.",
  },
];

export function LandingPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} enableColorScheme={false}>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-zinc-50/90 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Zap className="h-4 w-4" fill="currentColor" />
            </span>
            <span className="text-sm font-semibold">{siteConfig.name}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-500 md:flex dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white">
              Características
            </a>
            <a href="#preview" className="hover:text-zinc-900 dark:hover:text-white">
              Vista previa
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 sm:inline-flex dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_55%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:py-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Auditoría automatizada para equipos de producto
              </p>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-white">
                Salud de código e insights con IA, en un solo pulso.
              </h1>
              <p className="mt-5 max-w-xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
                {siteConfig.description} Conecta repos de GitHub, monitorea APIs y recibe alertas
                accionables en un dashboard multi-tenant diseñado para equipos B2B.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
                >
                  Probar demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Empezar gratis
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-800">
                  Next.js 16 + Auth.js
                </span>
                <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-800">
                  Prisma + PostgreSQL
                </span>
                <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-800">
                  BullMQ + Redis
                </span>
              </div>
            </div>

            <div id="preview" className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs text-zinc-400">dashboard — Acme Inc.</span>
                </div>
                <div className="grid gap-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Health score", value: "84", tone: "text-emerald-500" },
                      { label: "Proyectos en riesgo", value: "2", tone: "text-amber-500" },
                      { label: "Análisis del mes", value: "37", tone: "text-indigo-500" },
                      { label: "Alertas sin leer", value: "5", tone: "text-rose-500" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <p className="text-[11px] uppercase tracking-wide text-zinc-400">{stat.label}</p>
                        <p className={`mt-2 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">Tendencia semanal</p>
                      <span className="text-xs text-emerald-500">+12%</span>
                    </div>
                    <div className="flex h-24 items-end gap-2">
                      {[42, 58, 51, 67, 74, 69, 84].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400/70"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-100 p-4 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="h-4 w-4 text-indigo-500" />
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">vercel/next.js</p>
                      <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        MEDIUM
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Incremento de deuda técnica en módulos compartidos. Revisar dependencias y tests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">
                Todo lo que un equipo B2B necesita para auditar en producción
              </h2>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Desde el onboarding hasta invitaciones por email y conexión en vivo con GitHub, CodePulse
                está pensado para escalar contigo.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 py-20 dark:border-zinc-800">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-12 text-center text-white shadow-xl dark:border-indigo-900">
            <h2 className="text-3xl font-semibold">Empieza en minutos, no en semanas</h2>
            <p className="mx-auto mt-3 max-w-2xl text-indigo-100">
              Crea tu organización, invita al equipo y conecta tu primer repositorio. La IA se encarga del
              resto mientras BullMQ procesa los análisis en background.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex rounded-xl border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
              >
                Probar demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:px-6 md:flex-row dark:text-zinc-400">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Built for modern B2B engineering teams.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white">
              Login
            </Link>
            <Link href="/register" className="hover:text-zinc-900 dark:hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
    </ThemeProvider>
  );
}
