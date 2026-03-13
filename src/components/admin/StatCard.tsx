import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  className?: string;
  onClick?: () => void;
}

export default function StatCard({ title, value, subtitle, icon, trend, className, onClick }: StatCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-colors",
      onClick && "cursor-pointer hover:bg-card/80",
      className
    )} onClick={onClick}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold font-display leading-tight">{value}</p>
            {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>}
            {trend && (
              <p className={cn("text-[10px] sm:text-xs font-medium", trend.value >= 0 ? "text-emerald-400" : "text-red-400")}>
                {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label || "vs mês anterior"}
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
