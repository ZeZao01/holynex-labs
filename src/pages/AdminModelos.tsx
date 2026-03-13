import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LayoutTemplate, Loader2, Eye, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ModelItem {
  id: string;
  title: string;
  subtitle: string;
  niche: string;
  solution_type: string;
  investment_range: string;
  is_active: boolean;
  is_featured: boolean;
  badges: string[];
  cta_label: string;
  cta_url: string;
  public_url: string;
}

export default function AdminModelos() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("id, title, subtitle, niche, solution_type, investment_range, is_active, is_featured, badges, cta_label, cta_url, public_url")
        .eq("item_type", "modelo")
        .order("display_order", { ascending: true });
      if (error) throw error;
      setItems((data || []) as ModelItem[]);
    } catch { toast({ title: "Erro ao carregar modelos", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await supabase.from("portfolio_items").update({ is_active: !current }).eq("id", id);
      toast({ title: current ? "Modelo desativado" : "Modelo ativado" });
      await load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  const filtered = items.filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.niche?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos Modelo"
        description="Biblioteca de sistemas modelo para venda e reuso — vinculados ao portfólio como tipo 'modelo'"
        breadcrumbs={[{ label: "Modelos" }]}
        actions={<Button size="sm" onClick={() => navigate("/admin/portfolio-admin")}>Gerenciar no Portfólio</Button>}
      />

      <FilterToolbar searchPlaceholder="Buscar modelo..." searchValue={search} onSearchChange={setSearch} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-10 w-10 text-muted-foreground" />}
          title="Nenhum modelo cadastrado"
          description="Crie itens no portfólio com tipo 'Modelo' para que apareçam aqui."
          action={{ label: "Ir ao Portfólio", onClick: () => navigate("/admin/portfolio-admin") }}
        />
      ) : (
        <SectionCard noPadding>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Tipo Solução</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(i => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{i.title}</span>
                      {i.subtitle && <p className="text-xs text-muted-foreground">{i.subtitle}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{i.niche || "—"}</TableCell>
                  <TableCell className="text-sm">{i.solution_type || "—"}</TableCell>
                  <TableCell className="text-sm">{i.investment_range || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <StatusBadge status={i.is_active ? "active" : "paused"} label={i.is_active ? "Ativo" : "Inativo"} />
                      {i.is_featured && <Badge variant="outline" className="text-[10px]">Destaque</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {i.public_url && <Button variant="ghost" size="icon" className="h-7 w-7" asChild><a href={i.public_url} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(i.id, i.is_active)}><Eye className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}
    </div>
  );
}
