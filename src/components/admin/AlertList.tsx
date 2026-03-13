import { ReactNode } from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertItem {
  type: "warning" | "danger" | "info";
  text: string;
  action?: string;
}

const iconMap = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
};

const colorMap = {
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  danger: "text-red-400 bg-red-500/10 border-red-500/20",
  info: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

interface AlertListProps {
  items: AlertItem[];
}

export default function AlertList({ items }: AlertListProps) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const Icon = iconMap[item.type];
        return (
          <div key={i} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm", colorMap[item.type])}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.text}</span>
            {item.action && <span className="text-xs underline cursor-pointer shrink-0">{item.action}</span>}
          </div>
        );
      })}
    </div>
  );
}
