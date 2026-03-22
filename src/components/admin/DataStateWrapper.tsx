/**
 * DataStateWrapper — standardized loading / empty / error / success states.
 *
 * Wraps any data-driven admin panel content with consistent UI states.
 */

import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface DataStateWrapperProps {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  children: ReactNode;
}

export default function DataStateWrapper({
  loading,
  error,
  isEmpty,
  onRetry,
  loadingMessage = "Carregando dados...",
  emptyMessage = "Nenhum registro encontrado.",
  emptyIcon,
  children,
}: DataStateWrapperProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive font-medium">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        {emptyIcon || <Inbox className="h-10 w-10 text-muted-foreground/50" />}
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
