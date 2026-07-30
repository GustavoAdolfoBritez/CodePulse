import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { buildInsightPrompt } from "./prompts";
import { repoInsightSchema, type RepoInsight } from "./schema";

type AiProvider = "openai" | "anthropic" | "google";

function getProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER as AiProvider | undefined) ?? "openai";
  if (raw === "anthropic" || raw === "google" || raw === "openai") {
    return raw;
  }
  return "openai";
}

/** True when a real API key is configured for the active provider. */
function hasLiveCredentials(): boolean {
  const provider = getProvider();
  if (provider === "anthropic") {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }
  if (provider === "google") {
    return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
  }
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getModel() {
  const provider = getProvider();

  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic(process.env.AI_MODEL ?? "claude-3-5-sonnet-latest");
  }

  if (provider === "google") {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    // Prefer a light model on free tier; override with AI_MODEL in Vercel.
    return google(process.env.AI_MODEL ?? "gemini-1.5-flash-8b");
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(process.env.AI_MODEL ?? "gpt-4o");
}

interface GenerateInsightArgs {
  /** Code snippet, error log, or metrics summary to analyze. */
  context: string;
}

export type InsightGenerationMode = "LLM" | "HEURISTIC";

export interface GeneratedRepoInsight {
  insight: RepoInsight;
  mode: InsightGenerationMode;
}

/**
 * Legacy free-text call, kept for simple use cases. Prefer
 * `generateRepoInsight` for anything that needs to be persisted/rendered
 * with a score + severity.
 */
export async function generateInsight({ context }: GenerateInsightArgs): Promise<string> {
  const { text } = await generateText({
    model: getModel(),
    system: buildInsightPrompt(),
    prompt: context,
    // Free-tier Gemini quotas are shared; retries turn one 429 into 3 burned calls.
    maxRetries: 0,
  });

  return text;
}

/**
 * Runs the structured "Insight Automatizado" analysis: sends the extracted
 * GitHub/API context to the configured LLM (OpenAI, Anthropic, or Google Gemini
 * via the Vercel AI SDK) and returns a score, severity, summary and Markdown
 * suggestions ready to persist into `AnalysisResult`.
 *
 * Falls back to a deterministic, heuristics-based mock when no API key is
 * configured (or the live call fails), so the full pipeline (fetch -> AI ->
 * persist -> UI) can always be demoed end-to-end without external credentials.
 */
export async function generateRepoInsight(context: string): Promise<GeneratedRepoInsight> {
  if (!hasLiveCredentials()) {
    return { insight: buildMockInsight(context), mode: "HEURISTIC" };
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      system: buildInsightPrompt(),
      prompt: context,
      schema: repoInsightSchema,
      // One attempt only: automatic retries amplify 429 rate-limit burns on Gemini free tier.
      maxRetries: 0,
    });
    return { insight: object, mode: "LLM" };
  } catch (error) {
    console.error("[ai/client] Live LLM call failed, falling back to mock insight:", error);
    return { insight: buildMockInsight(context), mode: "HEURISTIC" };
  }
}

// ---------------------------------------------------------------------------
// Deterministic mock — no API key required.
//
// Parses the same plain-text context we would send to a real LLM (see
// buildRepoAnalysisContext / buildApiAnalysisContext) and derives a plausible
// score/severity/suggestions from simple, explainable heuristics. This keeps
// the mock "grounded" in the actual repo/API data instead of returning
// random numbers.
// ---------------------------------------------------------------------------

function bullets(items: string[], empty: string) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`;
}

function buildMockInsight(context: string): RepoInsight {
  const lower = context.toLowerCase();

  const openIssuesMatch = /open issues:\s*(\d+)/i.exec(context);
  const openIssues = openIssuesMatch ? Number(openIssuesMatch[1]) : 0;

  const commitLines = context
    .split("\n")
    .filter((line) => /^- [0-9a-f]{7}\s/.test(line.trim()));
  const commitCount = commitLines.length;

  const lastPushMatch = /last push:\s*(.+)/i.exec(context);
  const lastPush = lastPushMatch?.[1]?.trim();
  const daysSincePush =
    lastPush && lastPush !== "unknown"
      ? Math.max(0, Math.floor((Date.now() - new Date(lastPush).getTime()) / (1000 * 60 * 60 * 24)))
      : null;

  const hasReadme = lower.includes("readme");
  const hasTests = lower.includes("test") || lower.includes("spec");
  const hasCi =
    lower.includes(".github") || lower.includes("ci.yml") || lower.includes("workflows");
  const hasLockfile = /package-lock|yarn\.lock|pnpm-lock|composer\.lock|poetry\.lock/.test(lower);
  const hasEnvSample = lower.includes(".env.example") || lower.includes(".env.sample");
  const hasEslint = lower.includes("eslint") || lower.includes(".eslintrc");
  const hasDocker = lower.includes("dockerfile") || lower.includes("docker-compose");
  const looksLikeApi =
    lower.includes("## api endpoint") || lower.includes("api_endpoint") || lower.includes("http status");

  let score = 88;
  const strengths: string[] = [];
  const security: string[] = [];
  const quality: string[] = [];
  const critical: string[] = [];
  const suggestions: string[] = [];

  if (hasReadme) {
    strengths.push("Documentación inicial presente en la raíz del repositorio.");
  } else {
    score -= 8;
    quality.push("Mantenibilidad media: no se encontró `README` en la raíz.");
    suggestions.push("Agregar un `README` con propósito, setup local y flujo de despliegue.");
  }

  if (hasTests) {
    strengths.push("Se detectó evidencia de pruebas automatizadas.");
    quality.push("Cobertura de pruebas: hay señales de `test`/`spec` en el árbol del proyecto.");
  } else {
    score -= 15;
    quality.push("Ausencia evidente de suite de pruebas automatizadas.");
    critical.push("Sin pruebas automatizadas visibles: regresiones pueden pasar a producción sin freno.");
    suggestions.push("Introducir al menos smoke tests críticos en CI antes del próximo release.");
  }

  if (hasCi) {
    strengths.push("Hay pipelines de CI/CD configurados (`.github/workflows`).");
    quality.push("Estilo de entrega: CI presente para validar cambios de forma continua.");
  } else {
    score -= 10;
    quality.push("No se detectaron workflows de CI/CD.");
    suggestions.push("Configurar un workflow mínimo de lint + test en cada pull request.");
  }

  if (hasEslint) {
    strengths.push("Hay configuración de linting (`ESLint`) en el proyecto.");
    quality.push("Calidad y estilo: reglas de linting detectadas.");
  } else if (!looksLikeApi) {
    quality.push("No se detectó configuración explícita de linter (`ESLint`/equivalente).");
    suggestions.push("Estandarizar estilo con ESLint/Prettier (o el stack equivalente del lenguaje).");
  }

  if (hasLockfile) {
    strengths.push("Lockfile de dependencias presente: builds más reproducibles.");
    security.push("Higiene de dependencias: lockfile detectado; facilita auditorías de supply-chain.");
  } else {
    score -= 5;
    security.push("No se encontró lockfile: riesgo de versiones drift entre entornos.");
    suggestions.push("Commitear el lockfile del package manager para builds deterministas.");
  }

  if (hasEnvSample) {
    strengths.push("Existe plantilla de variables de entorno (`.env.example`).");
    security.push("No se observaron secretos hardcodeados en la raíz; hay plantilla `.env.example`.");
  } else {
    security.push(
      "No se detectó `.env.example`: conviene documentar variables sin exponer secretos reales."
    );
  }

  if (hasDocker) {
    strengths.push("Empaquetado/containerización disponible (`Dockerfile` / Compose).");
  }

  if (openIssues > 50) {
    score -= 15;
    critical.push(
      `${openIssues} issues abiertas: volumen alto que sugiere deuda técnica y backlog sin triage.`
    );
  } else if (openIssues > 15) {
    score -= 7;
    quality.push(`${openIssues} issues abiertas pendientes de priorización.`);
  } else {
    security.push("Volumen de issues abiertas dentro de un rango operable para el equipo.");
  }

  if (commitCount === 0) {
    score -= 10;
    critical.push("No se pudo leer historial de commits recientes.");
  }

  if (daysSincePush !== null) {
    if (daysSincePush > 365) {
      score -= 20;
      critical.push(
        `Sin actividad de push hace más de ${Math.floor(daysSincePush / 365)} año(s): riesgo de abandono operativo.`
      );
    } else if (daysSincePush > 180) {
      score -= 10;
      quality.push(`Último push hace ${daysSincePush} días: mantenimiento poco frecuente.`);
    } else if (daysSincePush <= 14) {
      strengths.push("Actividad de commits reciente en la rama principal.");
    }
  }

  if (looksLikeApi) {
    const unreachable = lower.includes("reachable: no");
    if (unreachable) {
      score -= 25;
      critical.push("El endpoint no respondió en la sonda de salud: impacto directo en disponibilidad.");
      suggestions.push("Verificar DNS, TLS, firewall y healthcheck del servicio expuesto.");
    } else {
      strengths.push("El endpoint respondió a la sonda de disponibilidad.");
      security.push("Superficie HTTP alcanzada correctamente en la corrida de auditoría.");
    }
  }

  score = Math.max(5, Math.min(98, Math.round(score)));

  const severity: RepoInsight["severity"] =
    score >= 85
      ? "INFO"
      : score >= 70
        ? "LOW"
        : score >= 50
          ? "MEDIUM"
          : score >= 30
            ? "HIGH"
            : "CRITICAL";

  const findingCount = critical.length + (security.length > 0 ? 0 : 0) + quality.filter((q) =>
    /ausencia|no se|riesgo|pendiente/i.test(q)
  ).length;

  const summary =
    critical.length === 0 && findingCount === 0
      ? `Auditoría completa: salud ${score}/100 sin hallazgos urgentes.`
      : `Auditoría completa: salud ${score}/100 con ${Math.max(critical.length, 1)} área(s) que requieren seguimiento.`;

  if (suggestions.length === 0) {
    suggestions.push(
      "Mantener el ritmo de monitoreo y repetir la auditoría tras cada release relevante."
    );
  }

  const report = [
    "## Resumen ejecutivo",
    summary,
    critical.length
      ? `Se identificaron puntos de atención inmediata relacionados con pruebas, CI o actividad del repositorio.`
      : `El proyecto muestra una base sólida; las recomendaciones siguientes son preventivas.`,
    "",
    "## Riesgos críticos",
    bullets(critical, "No se detectaron riesgos críticos que requieran acción inmediata en esta corrida."),
    "",
    "## Vulnerabilidades de seguridad",
    bullets(
      security,
      "Sin indicios de exposición de secretos o mala higiene de dependencias en el snapshot analizado."
    ),
    "",
    "## Calidad de código y estilo",
    bullets(quality, "Señales de calidad dentro de parámetros aceptables para el snapshot actual."),
    "",
    "## Fortalezas",
    bullets(strengths, "Sin fortalezas destacables en esta muestra; ampliar el alcance del análisis."),
    "",
    "## Sugerencias",
    bullets(suggestions, "Continuar con el ciclo de auditoría periódica."),
  ];

  return {
    score,
    severity,
    summary,
    suggestions: report.join("\n"),
  };
}
