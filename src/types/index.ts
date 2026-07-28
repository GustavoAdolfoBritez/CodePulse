export type ProjectSourceType = "GITHUB_REPO" | "API_ENDPOINT";
export type AnalysisStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type InsightSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type NotificationType = "INFO" | "WARNING" | "CRITICAL";

export interface ProjectSummary {
  id: string;
  name: string;
  sourceType: ProjectSourceType;
  githubRepoUrl?: string | null;
  apiUrl?: string | null;
  lastAnalysisStatus?: AnalysisStatus;
  errorCount: number;
  latencyMsP95?: number | null;
}

export interface PerformanceDataPoint {
  date: string;
  [key: string]: string | number;
}
