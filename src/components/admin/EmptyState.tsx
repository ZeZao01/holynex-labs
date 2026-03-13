import { ReactNode } from "react";
import { InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8" : "py-16",
      className
    )}>
      <div className={cn(
        "rounded-2xl bg-muted/50 mb-4 flex items-center justify-center",
        compact ? "p-3" : "p-4"
      )}>
        {icon || <InboxIcon className={cn(compact ? "h-8 w-8" : "h-10 w-10", "text-muted-foreground")} />}
      </div>
      <h3 className={cn(
        "font-semibold font-display mb-1",
        compact ? "text-base" : "text-lg"
      )}>{title}</h3>
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm",
          compact ? "text-xs mb-4" : "text-sm mb-6"
        )}>{description}</p>
      )}
      {action && (
        <Button size={compact ? "sm" : "default"} onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
