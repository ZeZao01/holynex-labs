import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const presets: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  delivered: "bg-primary/15 text-primary border-primary/30",
  paused: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  maintenance: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  hot: "bg-red-500/15 text-red-400 border-red-500/30",
  warm: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cold: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(presets[status] || presets.pending, className)}>
      {label || status}
    </Badge>
  );
}
