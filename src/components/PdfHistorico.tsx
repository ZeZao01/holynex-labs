import { useState, useEffect } from "react";
import { getPdfVersoes, getPdfDownloadUrl, deletePdfVersao, type PdfVersao } from "@/lib/pdf-storage";
import { Download, Trash2, FileText, Clock, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

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
    try {
      const data = await getPdfVersoes(propostaId);
      setVersoes(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (v: PdfVersao) => {
    try {
      await deletePdfVersao(v.id, v.storage_path);
      toast.success(`Versão ${v.versao} removida`);
      loadVersoes();
    } catch {
      toast.error("Erro ao remover PDF");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (versoes.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum PDF gerado ainda. Clique em "Exportar PDF" para criar o primeiro.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-display font-semibold text-sm text-primary mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" /> Histórico de PDFs ({versoes.length})
      </h3>
      <div className="space-y-3">
        {versoes.map((v) => (
          <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/30 border border-border/30 hover:border-primary/30 transition-colors">
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{v.nome_arquivo}</p>
              <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                <span>v{v.versao}</span>
                <span>{new Date(v.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span>{formatSize(v.tamanho_bytes)}</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <a
                href={getPdfDownloadUrl(v.storage_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              >
                <Download className="h-3 w-3" /> Baixar
              </a>
              <button
                onClick={() => handleDelete(v)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
