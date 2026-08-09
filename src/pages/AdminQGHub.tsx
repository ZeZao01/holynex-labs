import { ArrowRight, CheckCircle2, ExternalLink, Network, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QG_CAPABILITIES, QG_FLOW, QG_TOOLS } from "@/lib/qg-tools";

export default function AdminQGHub() {
  const navigate = useNavigate();

  const openTool = (href: string) => {
    if (href.startsWith("http")) window.open(href, "_blank", "noopener,noreferrer");
    else navigate(href);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="QG Agência"
        description="Operação integrada da HolyNex, do primeiro contato à entrega"
        actions={<Button onClick={() => navigate("/admin/orcamentos")} className="gap-2"><Sparkles className="h-4 w-4" /> Iniciar por um lead</Button>}
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {QG_TOOLS.map((tool) => (
          <article key={tool.name} className="flex min-h-44 flex-col rounded-md border border-border/60 bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><tool.icon className="h-4 w-4" /></div>
              <Badge variant="outline" className="text-[10px]">{tool.status}</Badge>
            </div>
            <h2 className="mt-4 text-base font-semibold">{tool.name}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{tool.description}</p>
            <Button variant="ghost" size="sm" onClick={() => openTool(tool.href)} className="mt-3 w-fit gap-1.5 px-0 hover:bg-transparent">
              Abrir {tool.href.startsWith("http") ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Fluxo unificado">
          <ol className="space-y-3">
            {QG_FLOW.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="Capacidades disponíveis">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QG_CAPABILITIES.map((capability) => (
              <div key={capability} className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/15 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {capability}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <Network className="h-4 w-4 shrink-0 text-amber-500" />
        Ferramentas locais abrem somente quando seus servidores estão ativos. Publicação, contato e ações irreversíveis continuam exigindo aprovação humana.
      </div>
    </div>
  );
}
