import { useState, useEffect } from "react";
import { getPdfVersoes, getPdfDownloadUrl, deletePdfVersao, updatePdfStatus, type PdfVersao, type PdfStatus } from "@/lib/pdf-storage";
import { Download, Trash2, FileText, Clock, Loader2, Eye, Ban, RefreshCw, Hash, Shield } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SectionCard from "@/components/admin/SectionCard";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
  gerado: { label: "Gerado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  enviado: { label: "Enviado", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  visualizado: { label: "Visualizado", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  substituido: { label: "Substituído", color: "bg-muted text-muted-foreground border-border" },
  revogado: { label: "Revogado", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

interface Props {
  propostaId: string;
  refreshKey: number;
}

export default function PdfHistorico({ propostaId, refreshKey }: Props) {
  const [versoes, setVersoes] = useState<PdfVersao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersoes();
  }, [propostaId, refreshKey]);

  const loadVersoes = async () => {
    try { setVersoes(await getPdfVersoes(propostaId)); } catch {} finally { setLoading(false); }
  };

  const handleDelete = async (v: PdfVersao) => {
    try { await deletePdfVersao(v.id, v.storage_path); toast.success(`v${v.versao} removida`); loadVersoes(); } catch { toast.error("Erro ao remover"); }
  };

  const handleStatusChange = async (v: PdfVersao, status: PdfStatus) => {
    try { await updatePdfStatus(v.id, status); toast.success(`Status: ${statusConfig[status]?.label}`); loadVersoes(); } catch { toast.error("Erro ao atualizar status"); }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (versoes.length === 0) {
    return (
      <SectionCard title="Histórico de PDFs">
        <div className="text-center py-8">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum PDF emitido. Clique em "Exportar PDF" para criar o primeiro.</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={`Histórico de PDFs (${versoes.length})`} action={<Clock className="h-4 w-4 text-muted-foreground" />}>
      <div className="space-y-3">
        {versoes.map(v => {
          const st = statusConfig[v.status] || statusConfig.gerado;
          const isActive = v.status === "gerado" || v.status === "enviado" || v.status === "visualizado";
          return (
            <div key={v.id} className={cn("rounded-xl border p-4 transition-colors", isActive ? "border-border/40 bg-card" : "border-border/20 bg-muted/20 opacity-70")}>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium">v{v.versao}</span>
                    <Badge variant="outline" className={cn("text-[10px]", st.color)}>{st.label}</Badge>
                    {v.template_used && v.template_used !== "default" && <Badge variant="outline" className="text-[10px]">{v.template_used}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-1">{v.nome_arquivo}</p>
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span>{new Date(v.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{formatSize(v.tamanho_bytes)}</span>
                    {v.document_code && (
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {v.document_code}</span>
                    )}
                    {v.document_hash && (
                      <span className="flex items-center gap-1" title={v.document_hash}><Shield className="h-3 w-3" /> {v.document_hash.substring(0, 12)}…</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap">
                  <a href={getPdfDownloadUrl(v.storage_path)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7"><Download className="h-3 w-3" /> Baixar</Button>
                  </a>
                  <a href={getPdfDownloadUrl(v.storage_path)} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs h-7"><Eye className="h-3 w-3" /></Button>
                  </a>
                  {isActive && (
                    <>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-amber-400" onClick={() => handleStatusChange(v, "enviado")} disabled={v.status === "enviado"}>
                        <RefreshCw className="h-3 w-3" /> Enviado
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-destructive" onClick={() => handleStatusChange(v, "revogado")}>
                        <Ban className="h-3 w-3" /> Revogar
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(v)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
