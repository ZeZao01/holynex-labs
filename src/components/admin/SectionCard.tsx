import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function SectionCard({ title, action, children, className, noPadding }: SectionCardProps) {
  return (
    <Card className={cn(className)}>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(noPadding && "p-0", !title && "pt-5")}>{children}</CardContent>
    </Card>
  );
}
