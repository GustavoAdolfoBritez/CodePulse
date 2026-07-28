/**
 * Strip leftover demo/engineering asides from persisted insight markdown
 * so portfolio/demo screens never show internal "mock / API key" seams.
 */
export function sanitizeInsightMarkdown(content: string): string {
  return content
    .replace(/^##\s*Resumen automatizado\s*\(modo mock\)\s*$/gim, "## Resumen ejecutivo")
    .replace(
      /^_?Generado por heurísticas locales[^\n]*_?\s*$/gim,
      ""
    )
    .replace(/configura\s+`?(OPENAI_API_KEY|ANTHROPIC_API_KEY)`?[^\n]*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
