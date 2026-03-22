import EmptyState from "@/components/admin/EmptyState";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="py-16">
      <EmptyState
        icon={<ShieldAlert className="h-10 w-10 text-destructive" />}
        title="Acesso negado"
        description="Você não possui permissão para acessar esta área."
      />
    </div>
  );
}
