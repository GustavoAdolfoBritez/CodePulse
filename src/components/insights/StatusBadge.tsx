import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import type { AnalysisStatus } from "@/types";

const statusConfig: Record<
  AnalysisStatus,
  { label: string; color: BadgeColor; icon: typeof Clock; spin?: boolean }
> = {
  PENDING: { label: "Pendiente", color: "zinc", icon: Clock },
  RUNNING: { label: "Procesando", color: "sky", icon: Loader2, spin: true },
  COMPLETED: { label: "Completado", color: "emerald", icon: CheckCircle2 },
  FAILED: { label: "Falló", color: "rose", icon: XCircle },
};

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  const { label, color, icon: Icon, spin } = statusConfig[status] ?? statusConfig.PENDING;
  return (
    <Badge color={color} icon={<Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />}>
      {label}
    </Badge>
  );
}
