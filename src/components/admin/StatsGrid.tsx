import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const colMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export default function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return <div className={cn("grid gap-4", colMap[columns], className)}>{children}</div>;
}
