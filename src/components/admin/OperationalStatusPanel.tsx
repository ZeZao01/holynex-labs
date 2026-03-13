import { cn } from "@/lib/utils";

type HealthStatus = "ok" | "attention" | "pending";

export interface OperationalItem {
  label: string;
  status: HealthStatus;
}

const statusConfig: Record<HealthStatus, { label: string; dot: string }> = {
  ok: { label: "OK", dot: "bg-emerald-400" },
  attention: { label: "Atenção", dot: "bg-amber-400" },
  pending: { label: "Pendente", dot: "bg-muted-foreground" },
};

interface OperationalStatusPanelProps {
  items: OperationalItem[];
}

export default function OperationalStatusPanel({ items }: OperationalStatusPanelProps) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const cfg = statusConfig[item.status];
        return (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
              <span className="text-xs text-muted-foreground w-16 text-right">{cfg.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
