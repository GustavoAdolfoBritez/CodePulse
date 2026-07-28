import { z } from "zod";

export const insightSeverityValues = [
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

/**
 * Structured shape every repo/API analysis must produce, regardless of
 * whether it came from a real LLM call or the deterministic mock fallback.
 */
export const repoInsightSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall code health score from 0 (critical) to 100 (excellent)."),
  severity: z.enum(insightSeverityValues),
  summary: z
    .string()
    .describe("One-sentence diagnosis, e.g. 'Healthy repo with minor housekeeping issues.'"),
  suggestions: z
    .string()
    .describe(
      "Markdown-formatted optimization suggestions with headings/bullets/code blocks where relevant."
    ),
});

export type RepoInsight = z.infer<typeof repoInsightSchema>;
