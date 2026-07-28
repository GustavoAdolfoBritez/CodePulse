import { AlertTriangle, Info, ShieldX, TriangleAlert } from "lucide-react";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import type { InsightSeverity } from "@/types";

const severityConfig: Record<
  InsightSeverity,
  { label: string; color: BadgeColor; icon: typeof Info }
> = {
  INFO: { label: "Info", color: "sky", icon: Info },
  LOW: { label: "Baja", color: "emerald", icon: Info },
  MEDIUM: { label: "Media", color: "amber", icon: AlertTriangle },
  HIGH: { label: "Alta", color: "orange", icon: TriangleAlert },
  CRITICAL: { label: "Crítica", color: "rose", icon: ShieldX },
};

export function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  const { label, color, icon: Icon } = severityConfig[severity] ?? severityConfig.INFO;
  return (
    <Badge color={color} icon={<Icon className="h-3 w-3" />}>
      {label}
    </Badge>
  );
}