import { useNavigate } from "react-router-dom";
import { Palette, RefreshCcw } from "lucide-react";
import SectionCard from "@/components/admin/SectionCard";
import EmptyState from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import BrandStudioStats from "@/components/brand-studio/BrandStudioStats";
import BrandStudioSectionLinks from "@/components/brand-studio/BrandStudioSectionLinks";
import { useBrandStudioOverview } from "@/hooks/brand-studio/useBrandStudioOverview";

export default function AdminBrandStudio() {
  const navigate = useNavigate();
  const { loading, error, stats, refresh } = useBrandStudioOverview(true);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Brand Studio AI"
        description="Base estrutural do dominio de branding com tarefas de IA, assets versionados e apresentacoes"
      />

      {error ? (
        <SectionCard>
          <EmptyState
            icon={<Palette className="h-8 w-8 text-muted-foreground" />}
            title="Falha ao carregar Brand Studio"
            description={error}
            action={{ label: "Recarregar", onClick: refresh }}
            compact
          />
        </SectionCard>
      ) : (
        <BrandStudioStats stats={stats} />
      )}

      <SectionCard title="Navegacao do Dominio">
        <BrandStudioSectionLinks />
      </SectionCard>

      <SectionCard
        title="Fundacao Arquitetural"
        action={
          <Button size="sm" variant="outline" onClick={() => navigate("/admin/brand-studio/projetos")}>
            Abrir projetos <RefreshCcw className="h-3.5 w-3.5 ml-1" />
          </Button>
        }
      >
        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
          <li>Branding tratado como dominio nativo com rotas protegidas no painel administrativo.</li>
          <li>Persistencia inicial preparada para briefs, tarefas, runs de IA, assets e versoes.</li>
          <li>Escopos de permissao e trilha de auditoria conectados desde a criacao das entidades.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
