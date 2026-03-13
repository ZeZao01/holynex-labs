import { ReactNode } from "react";
import StatusBadge from "./StatusBadge";

export interface ActivityItem {
  icon: ReactNode;
  text: string;
  time: string;
  status?: string;
  statusLabel?: string;
}

interface RecentActivityListProps {
  items: ActivityItem[];
}

export default function RecentActivityList({ items }: RecentActivityListProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <div className="mt-0.5 p-1.5 rounded-md bg-muted/60 text-muted-foreground shrink-0">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground truncate">{item.text}</p>
            <p className="text-xs text-muted-foreground">{item.time}</p>
          </div>
          {item.status && (
            <StatusBadge status={item.status} label={item.statusLabel} className="shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
