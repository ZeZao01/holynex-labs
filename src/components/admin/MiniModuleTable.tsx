import StatusBadge from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export interface MiniModuleItem {
  label: string;
  subtitle?: string;
  status: string;
  statusLabel?: string;
}

interface MiniModuleTableProps {
  items: MiniModuleItem[];
  onViewAll?: () => void;
}

export default function MiniModuleTable({ items, onViewAll }: MiniModuleTableProps) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.label}</p>
            {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
          </div>
          <StatusBadge status={item.status} label={item.statusLabel} className="shrink-0" />
        </div>
      ))}
      {onViewAll && (
        <Button variant="ghost" size="sm" className="w-full gap-1 text-xs text-muted-foreground" onClick={onViewAll}>
          Ver tudo <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
