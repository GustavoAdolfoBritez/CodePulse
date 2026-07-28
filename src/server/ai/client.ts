import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { buildInsightPrompt } from "./prompts";
import { repoInsightSchema, type RepoInsight } from "./schema";

type AiProvider = "openai" | "anthropic";

function getProvider(): AiProvider {
  return (process.env.AI_PROVIDER as AiProvider | undefined) ?? "openai";
}

/** True when a real API key is configured for the active provider. */
function hasLiveCredentials(): boolean {
  const provider = getProvider();
  const key = provider === "anthropic" ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

function getModel() {
  const provider = getProvider();

  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic(process.env.AI_MODEL ?? "claude-3-5-sonnet-latest");
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai(process.env.AI_MODEL ?? "gpt-4o");
}

interface GenerateInsightArgs {
  /** Code snippet, error log, or metrics summary to analyze. */
  context: string;
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
  });

  return text;
}

/**
 * Runs the structured "Insight Automatizado" analysis: sends the extracted
 * GitHub/API context to the configured LLM (OpenAI or Anthropic, via the
 * Vercel AI SDK) and returns a score, severity, summary and Markdown
 * suggestions ready to persist into `AnalysisResult`.
 *
 * Falls back to a deterministic, heuristics-based mock when no API key is
 * configured (or the live call fails), so the full pipeline (fetch -> AI ->
 * persist -> UI) can always be demoed end-to-end without external credentials.
 */
export async function generateRepoInsight(context: string): Promise<RepoInsight> {
  if (!hasLiveCredentials()) {
    return buildMockInsight(context);
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      system: buildInsightPrompt(),
      prompt: context,
      schema: repoInsightSchema,
    });
    return object;
  } catch (error) {
    console.error("[ai/client] Live LLM call failed, falling back to mock insight:", error);
    return buildMockInsight(context);
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
  const hasCi = lower.includes(".github") || lower.includes("ci.yml") || lower.includes("workflows");
  const hasLockfile = /package-lock|yarn\.lock|pnpm-lock/.test(lower);

  let score = 90;
  const positives: string[] = [];
  const negatives: string[] = [];

  if (!hasReadme) {
    score -= 8;
    negatives.push("No se encontró un `README` en la raíz del repositorio.");
  } else {
    positives.push("El repositorio documenta su propósito en un `README`.");
  }

  if (!hasTests) {
    score -= 15;
    negatives.push("No se detectó una carpeta o archivos de pruebas automatizadas.");
  } else {
    positives.push("Existe evidencia de pruebas automatizadas en el repositorio.");
  }

  if (!hasCi) {
    score -= 10;
    negatives.push("No hay workflows de CI/CD (`.github/workflows`) configurados.");
  } else {
    positives.push("El repositorio cuenta con pipelines de CI/CD.");
  }

  if (!hasLockfile) {
    score -= 5;
    negatives.push("No se encontró un lockfile de dependencias, lo que puede causar builds no reproducibles.");
  }

  if (openIssues > 50) {
    score -= 15;
    negatives.push(`Hay ${openIssues} issues abiertas, un volumen alto que sugiere deuda técnica acumulada.`);
  } else if (openIssues > 15) {
    score -= 7;
    negatives.push(`Hay ${openIssues} issues abiertas pendientes de triage.`);
  }

  if (commitCount === 0) {
    score -= 10;
    negatives.push("No se pudo leer historial de commits recientes.");
  } else if (commitCount < 3) {
    score -= 3;
  }

  if (daysSincePush !== null) {
    if (daysSincePush > 365) {
      score -= 20;
      negatives.push(`El repositorio no recibe pushes hace más de ${Math.floor(daysSincePush / 365)} año(s), posible abandono.`);
    } else if (daysSincePush > 180) {
      score -= 10;
      negatives.push(`El último push fue hace ${daysSincePush} días; la actividad de mantenimiento es baja.`);
    } else if (daysSincePush <= 14) {
      positives.push("El repositorio tiene actividad de commits reciente.");
    }
  }

  score = Math.max(5, Math.min(98, Math.round(score)));

  const severity: RepoInsight["severity"] =
    score >= 85 ? "INFO" : score >= 70 ? "LOW" : score >= 50 ? "MEDIUM" : score >= 30 ? "HIGH" : "CRITICAL";

  const summary =
    negatives.length === 0
      ? "Repositorio saludable, sin hallazgos relevantes en esta corrida."
      : `${negatives.length} hallazgo(s) detectado(s); puntuación de salud ${score}/100.`;

  const suggestionsSections = [
    "## Resumen automatizado (modo mock)",
    "_Generado por heurísticas locales — configura `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` para análisis con LLM real._",
    "",
    "### Fortalezas",
    positives.length ? positives.map((p) => `- ${p}`).join("\n") : "- (ninguna detectada en esta corrida)",
    "",
    "### Sugerencias de optimización",
    negatives.length
      ? negatives.map((n) => `- ${n}`).join("\n")
      : "- Mantener las buenas prácticas actuales y monitorear métricas de rendimiento periódicamente.",
  ];

  return {
    score,
    severity,
    summary,
    suggestions: suggestionsSections.join("\n"),
  };
}
