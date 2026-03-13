import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface QuickAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export default function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {actions.map((a, i) => (
        <Button key={i} variant="outline" size="sm" className="justify-start gap-2 h-auto py-3 px-3" onClick={a.onClick}>
          <span className="text-primary shrink-0">{a.icon}</span>
          <span className="text-xs truncate">{a.label}</span>
        </Button>
      ))}
    </div>
  );
}
