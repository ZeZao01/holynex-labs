import { useState, useEffect } from "react";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import PortfolioForm from "@/components/admin/PortfolioForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Globe, Plus, Edit, Trash2, Eye, EyeOff, Star, MoreHorizontal, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  PortfolioItem, listPortfolioItems, savePortfolioItem, deletePortfolioItem, addPortfolioEvent,
  ITEM_TYPES,
} from "@/lib/portfolio-items";

export default function AdminPortfolioAdmin() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [filtered, setFiltered] = useState<PortfolioItem[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [listState, setListState] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [loadError, setLoadError] = useState("");

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(search ? items.filter((i) => i.title.toLowerCase().includes(term) || (i.slug || "").toLowerCase().includes(term)) : items);
  }, [items, search]);

  async function load() {
    setListState("loading");
    setLoadError("");
    try {
      const data = await listPortfolioItems();
      setItems(data);
      setListState(data.length === 0 ? "empty" : "success");
    } catch {
      setListState("error");
      setLoadError("Não foi possível carregar os itens do portfólio.");
      toast({ title: "Erro ao carregar portfólio", variant: "destructive" });
    }
  }

  async function handleSave(data: Partial<PortfolioItem>) {
    setLoading(true);
    try {
      const saved = await savePortfolioItem({ ...data, id: editing?.id });
      await addPortfolioEvent(saved.id, editing ? "item_editado" : "item_criado");
      toast({ title: editing ? "Item atualizado!" : "Item criado!" });
      setFormOpen(false); setEditing(null); load();
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function handleToggleActive(item: PortfolioItem) {
    try {
      const nextStatus = (item.status || (item.is_active ? "published" : "draft")) === "published" ? "draft" : "published";
      await savePortfolioItem({ id: item.id, is_active: nextStatus === "published", status: nextStatus });
      await addPortfolioEvent(item.id, nextStatus === "published" ? "publicado" : "desativado");
      toast({ title: nextStatus === "published" ? "Publicado!" : "Desativado!" }); load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handleArchive(item: PortfolioItem) {
    try {
      const nextStatus = item.status === "archived" ? "draft" : "archived";
      await savePortfolioItem({ id: item.id, status: nextStatus, is_active: false });
      await addPortfolioEvent(item.id, nextStatus === "archived" ? "arquivado" : "restaurado");
      toast({ title: nextStatus === "archived" ? "Arquivado!" : "Restaurado!" }); load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handleToggleFeatured(item: PortfolioItem) {
    try {
      await savePortfolioItem({ id: item.id, is_featured: !item.is_featured });
      await addPortfolioEvent(item.id, item.is_featured ? "removido_destaque" : "destacado");
      toast({ title: "Atualizado!" }); load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handleDelete(item: PortfolioItem) {
    if (!confirm("Remover este item do portfólio?")) return;
    try { await deletePortfolioItem(item.id); toast({ title: "Removido!" }); load(); }
    catch { toast({ title: "Erro ao remover", variant: "destructive" }); }
  }

  async function handleReorder(item: PortfolioItem, direction: number) {
    try {
      const currentOrder = item.sort_order ?? item.display_order ?? 0;
      await savePortfolioItem({ id: item.id, sort_order: currentOrder + direction, display_order: currentOrder + direction });
      load();
    } catch {}
  }

  const getStatusMeta = (item: PortfolioItem) => {
    const status = item.status || (item.is_active ? "published" : "draft");
    if (status === "published") return { label: "Publicado", variant: "active" };
    if (status === "archived") return { label: "Arquivado", variant: "cancelled" };
    return { label: "Rascunho", variant: "paused" };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Portfólio Público" description="Gerencie a vitrine pública de projetos da agência" breadcrumbs={[{ label: "Portfólio" }]} />

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <FilterToolbar searchPlaceholder="Buscar projeto..." searchValue={search} onSearchChange={setSearch} />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Item</Button>
      </div>

      {listState === "loading" ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">Carregando portfólio...</div>
      ) : listState === "error" ? (
        <EmptyState icon={<Globe className="h-10 w-10 text-muted-foreground" />} title="Erro ao carregar" description={loadError} action={{ label: "Tentar novamente", onClick: () => load() }} />
      ) : listState === "empty" ? (
        <EmptyState icon={<Globe className="h-10 w-10 text-muted-foreground" />} title="Nenhum projeto no portfólio" description="Adicione projetos com thumbnails, badges e CTAs para conversão." action={{ label: "Adicionar ao Portfólio", onClick: () => { setEditing(null); setFormOpen(true); } }} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Thumb</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Badges</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const statusMeta = getStatusMeta(item);
                const previewUrl = item.system_url || item.public_url;
                const gallery = item.gallery_images || item.gallery_urls || [];
                const thumbnail = item.thumbnail_url || item.cover_image_url || gallery[0];
                return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleReorder(item, -1)}><ArrowUp className="h-3 w-3" /></button>
                      <span>{item.sort_order ?? item.display_order}</span>
                      <button onClick={() => handleReorder(item, 1)}><ArrowDown className="h-3 w-3" /></button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {thumbnail ? <img src={thumbnail} alt="" className="h-10 w-16 rounded object-cover" /> : <div className="h-10 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>}
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.slug || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{ITEM_TYPES.find((t) => t.value === item.item_type)?.label || item.item_type}</Badge></TableCell>
                  <TableCell className="text-xs">{item.category || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {previewUrl ? (
                      <span className={item.allow_public_preview ? "text-emerald-500" : "text-muted-foreground"}>
                        {item.allow_public_preview ? "Público" : "Privado"}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">{(item.badges || []).slice(0, 2).map((b) => <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <StatusBadge status={statusMeta.variant} label={statusMeta.label} />
                      {item.is_featured && <StatusBadge status="hot" label="⭐" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(item); setFormOpen(true); }}><Edit className="h-3 w-3 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(item)}>{item.is_active ? <><EyeOff className="h-3 w-3 mr-2" /> Desativar</> : <><Eye className="h-3 w-3 mr-2" /> Ativar</>}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(item)}><Star className="h-3 w-3 mr-2" /> {item.is_featured ? "Remover Destaque" : "Destacar"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(item)}><Globe className="h-3 w-3 mr-2" /> {item.status === "archived" ? "Restaurar" : "Arquivar"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive"><Trash2 className="h-3 w-3 mr-2" /> Remover</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Item" : "Novo Item do Portfólio"}</DialogTitle></DialogHeader>
          <PortfolioForm item={editing} onSave={handleSave} onCancel={() => setFormOpen(false)} loading={loading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
