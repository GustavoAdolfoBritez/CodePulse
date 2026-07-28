import type { InsightSeverity, ProjectSourceType } from "@/types";

export interface AnalyticsFilters {
  q: string;
  severity: InsightSeverity | "";
  sourceType: ProjectSourceType | "";
  from: string;
  to: string;
}

export interface SearchParamsInput {
  [key: string]: string | string[] | undefined;
}

const validSeverities = new Set<InsightSeverity>(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const validSourceTypes = new Set<ProjectSourceType>(["GITHUB_REPO", "API_ENDPOINT"]);

function takeFirst(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseAnalyticsFilters(searchParams: SearchParamsInput): AnalyticsFilters {
  const q = takeFirst(searchParams.q).trim();
  const severityValue = takeFirst(searchParams.severity).trim().toUpperCase();
  const sourceTypeValue = takeFirst(searchParams.sourceType).trim().toUpperCase();
  const from = takeFirst(searchParams.from).trim();
  const to = takeFirst(searchParams.to).trim();

  return {
    q,
    severity: validSeverities.has(severityValue as InsightSeverity)
      ? (severityValue as InsightSeverity)
      : "",
    sourceType: validSourceTypes.has(sourceTypeValue as ProjectSourceType)
      ? (sourceTypeValue as ProjectSourceType)
      : "",
    from,
    to,
  };
}

export function matchesAnalyticsFilters(
  filters: AnalyticsFilters,
  input: {
    name: string;
    sourceType: ProjectSourceType;
    target?: string | null;
    latestCreatedAt?: Date | null;
    latestSeverity?: InsightSeverity | null;
  }
): boolean {
  const haystack = `${input.name} ${input.target ?? ""}`.toLowerCase();
  if (filters.q && !haystack.includes(filters.q.toLowerCase())) {
    return false;
  }

  if (filters.sourceType && input.sourceType !== filters.sourceType) {
    return false;
  }

  if (filters.severity && input.latestSeverity !== filters.severity) {
    return false;
  }

  if ((filters.from || filters.to) && !input.latestCreatedAt) {
    return false;
  }

  if (filters.from && input.latestCreatedAt) {
    const fromDate = new Date(`${filters.from}T00:00:00`);
    if (input.latestCreatedAt < fromDate) {
      return false;
    }
  }

  if (filters.to && input.latestCreatedAt) {
    const toDate = new Date(`${filters.to}T23:59:59.999`);
    if (input.latestCreatedAt > toDate) {
      return false;
    }
  }

  return true;
}
