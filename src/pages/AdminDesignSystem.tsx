// Vitrine do HolyNex Design System: renderiza a biblioteca inteira com variantes e estados.
// Rota interna: /admin/design-system (atrás do login do admin). Fonte: design-system/ na raiz.
// O design system foi desenhado só em tema claro; não há tema escuro para mostrar.
import { useState, type ReactNode } from "react";
import "@ds/holynex-ds.scoped.css";
import {
  AreaChart, Avatar, Badge, BarChart, BottomNav, Breadcrumb, Button, Card, Checkbox, Chip,
  DataTable, Dialog, DonutChart, Icon, IconButton, Input, Pagination, Progress, Radio, Select,
  Sidebar, StatCard, Switch, Tabs, Toast, Tooltip, Topbar,
} from "@ds";

const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} style={{ display: "grid", gap: 16 }}>
      <h2 style={{ font: "var(--type-title, 600 20px/1.3 var(--font-ui))", margin: 0, color: "var(--text-primary)" }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</div>;
}

const invoices = [
  { id: "FT-1042", cliente: "RD Limpezas", valor: 4800, status: "Pago" },
  { id: "FT-1043", cliente: "Clínica Aurora", valor: 2350, status: "Pendente" },
  { id: "FT-1044", cliente: "Meu Iate", valor: 12900, status: "Vencida" },
];
const tone = { Pago: "success", Pendente: "warning", Vencida: "danger" } as const;

export default function AdminDesignSystem() {
  const [tab, setTab] = useState("visao");
  const [page, setPage] = useState(2);
  const [dialog, setDialog] = useState(false);
  const [chip, setChip] = useState(true);

  return (
    <div className="hn-ds" style={{ position: "relative", zIndex: 10, isolation: "isolate", minHeight: "100%", padding: 24, display: "grid", gap: 40, borderRadius: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <Breadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Design system" }]} />
        <h1 style={{ margin: 0, font: "600 32px/1.15 var(--font-ui)", color: "var(--text-primary)" }}>HolyNex Design System</h1>
        <p className="hn-muted" style={{ margin: 0 }}>
          Biblioteca inteira com variantes e estados. Fonte da verdade: <code>DESIGN.md</code> e <code>design-system/</code>. Só tema claro.
        </p>
      </header>

      <Section id="botoes" title="Botões">
        <Row>
          {(["primary", "dark", "secondary", "soft", "ghost", "danger"] as const).map((v) => (
            <Button key={v} variant={v} iconLeft="plus">{v}</Button>
          ))}
        </Row>
        <Row>
          <Button size="sm">Pequeno</Button><Button size="md">Médio</Button><Button size="lg" iconRight="arrow-up-right">Grande</Button>
          <Button shape="rounded">Arredondado</Button><Button loading>Carregando</Button><Button disabled>Desativado</Button>
        </Row>
        <Row>
          {(["secondary", "ghost", "soft", "primary", "dark"] as const).map((v) => (
            <IconButton key={v} icon="bell" label={`Notificações (${v})`} variant={v} dot={v === "secondary"} />
          ))}
          <IconButton icon="settings" label="Configurações" shape="square" variant="secondary" />
          <IconButton icon="trash-2" label="Excluir" disabled />
          <Icon name="sparkles" size={20} label="Ícone" />
        </Row>
      </Section>

      <Section id="formularios" title="Formulários">
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Input label="Buscar" placeholder="Cliente, fatura ou projeto" iconLeft="search" kbd={["⌘", "K"]} />
          <Input label="E-mail" defaultValue="financeiro@" error="Informe um e-mail completo" />
          <Input label="Valor" defaultValue="4.800" suffix="R$" hint="Sem centavos" variant="sunken" />
          <Input label="Desativado" defaultValue="Bloqueado" disabled />
          <Select label="Status" options={["Pago", "Pendente", "Vencida"]} placeholder="Escolha" />
          <Select label="Período" variant="pill" options={[{ value: "30", label: "Últimos 30 dias" }, { value: "90", label: "Últimos 90 dias" }]} />
        </div>
        <Row>
          <Checkbox label="Lembrar acesso" defaultChecked />
          <Checkbox label="Parcial" indeterminate />
          <Checkbox label="Desativado" disabled />
          <Radio name="plano" label="Mensal" defaultChecked />
          <Radio name="plano" label="Anual" description="2 meses grátis" />
          <Switch label="Notificações" defaultChecked />
          <Switch label="Modo compacto" size="sm" />
        </Row>
      </Section>

      <Section id="exibicao" title="Cartões, números e etiquetas">
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <StatCard variant="brand" label="Receita do mês" value="R$ 86.240" delta={8.1} deltaLabel="vs. outubro" icon="wallet" />
          <StatCard label="Clientes ativos" value="42" delta={-2.4} icon="users" />
          <StatCard variant="card" label="Propostas abertas" value="12" unit="/ 18" footnote="6 aguardando resposta" icon="file-text" />
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {(["default", "sunken", "brand", "inverse"] as const).map((v) => (
            <Card key={v} variant={v} title={`Card ${v}`} subtitle="Uma linha de descrição" actions={<IconButton icon="more-horizontal" label="Mais" size="sm" />}>
              <p style={{ margin: 0 }}>Conteúdo do cartão.</p>
            </Card>
          ))}
        </div>
        <Row>
          {(["neutral", "brand", "success", "warning", "danger", "info"] as const).map((t) => <Badge key={t} tone={t} dot>{t}</Badge>)}
          <Badge tone="brand" variant="solid">Sólido</Badge><Badge tone="info" variant="outline" icon="info">Contorno</Badge>
        </Row>
        <Row>
          <Chip selected={chip} onClick={() => setChip(!chip)} icon="filter">Filtro ativo</Chip>
          <Chip onRemove={() => undefined}>Removível</Chip>
          <Chip size="sm">Pequeno</Chip>
          <Avatar name="José Wilk" status="online" /><Avatar name="Rafael Lima" status="away" size={40} /><Avatar name="Sem Foto" status="offline" />
        </Row>
        <div style={{ display: "grid", gap: 12, maxWidth: 480 }}>
          <Progress value={72} label="Meta de receita" showValue />
          <Progress value={12} max={12} variant="dots" dots={12} tone="success" label="Parcelas" />
          <Progress value={40} variant="split" tone="warning" size="sm" label="Uso do plano" />
        </div>
      </Section>

      <Section id="navegacao" title="Navegação">
        <Tabs items={[{ id: "visao", label: "Visão geral", icon: "layout-dashboard" }, { id: "faturas", label: "Faturas", meta: "(3)" }, "Relatórios"]} value={tab} onChange={setTab} />
        <Tabs items={["Dia", "Semana", "Mês"]} value="Semana" variant="segmented" size="sm" />
        <Pagination page={page} pageCount={8} onChange={setPage} summary="Mostrando 11 a 20 de 74" />
      </Section>

      <Section id="feedback" title="Avisos e diálogos">
        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <Toast tone="success" title="Fatura enviada" description="O cliente recebeu o link de pagamento." />
          <Toast tone="danger" title="Falha ao sincronizar" description="Tente de novo em alguns minutos." action={<Button size="sm" variant="secondary">Tentar de novo</Button>} />
        </div>
        <Row>
          <Tooltip label="Exportar em CSV"><IconButton icon="download" label="Exportar" variant="secondary" /></Tooltip>
          <Button variant="dark" onClick={() => setDialog(true)}>Abrir diálogo</Button>
        </Row>
        <Dialog open={dialog} onClose={() => setDialog(false)} title="Excluir fatura?" description="Essa ação não pode ser desfeita." icon="alert-triangle"
          footer={<><Button variant="secondary" onClick={() => setDialog(false)}>Cancelar</Button><Button variant="danger" onClick={() => setDialog(false)}>Excluir</Button></>} />
      </Section>

      <Section id="dados" title="Dados e gráficos">
        <Card title="Receita x despesa">
          <BarChart data={[{ label: "Jun", up: 62, down: 40 }, { label: "Jul", up: 70, down: 44 }, { label: "Ago", up: 58, down: 39 }, { label: "Set", up: 81, down: 47 }, { label: "Out", up: 79, down: 50 }, { label: "Nov", up: 86, down: 52 }]}
            series={["Receita", "Despesa"]} format={(v: number) => brl(v * 1000)} highlight={5} showLegend />
        </Card>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <Card title="Saldo diário"><AreaChart data={[12, 18, 15, 22, 27, 25, 31]} compare={[10, 12, 14, 15, 18, 20, 21]} labels={["S", "T", "Q", "Q", "S", "S", "D"]} format={(v: number) => brl(v * 1000)} /></Card>
          <Card title="Receita por serviço"><DonutChart segments={[{ label: "Sites", value: 46 }, { label: "Sistemas", value: 32 }, { label: "Automação", value: 22 }]} label="Total" value="R$ 86 mil" legend /></Card>
        </div>
        <DataTable
          columns={[
            { key: "id", header: "Fatura", primary: true },
            { key: "cliente", header: "Cliente" },
            { key: "valor", header: "Valor", align: "right", render: (r: (typeof invoices)[number]) => <span className="hn-num">{brl(r.valor)}</span> },
            { key: "status", header: "Status", render: (r: (typeof invoices)[number]) => <Badge tone={tone[r.status as keyof typeof tone]} dot>{r.status}</Badge> },
          ]}
          rows={invoices} rowKey="id" selectable />
        <DataTable columns={[{ key: "id", header: "Fatura" }]} rows={[]} />
      </Section>

      <Section id="estrutura" title="Estrutura do painel (shell)">
        {/* transform cria um "palco": Sidebar e BottomNav são fixos na tela no app real; aqui ficam presos na caixa de demonstração. */}
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 248px) minmax(0, 1fr)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden", minHeight: 360, transform: "translateZ(0)" }}>
          <Sidebar brand={{ name: "HolyNex" }} account={{ name: "José Wilk", subtitle: "Admin" }} activeId="dash"
            sections={[{ items: [{ id: "dash", label: "Painel", icon: "layout-dashboard" }, { id: "fin", label: "Financeiro", icon: "wallet", badge: "3" }, { id: "prop", label: "Propostas", icon: "file-text" }] }]} />
          <div style={{ display: "grid", alignContent: "start" }}>
            <Topbar title="Bom te ver, José!" subtitle="Acompanhe receita, clientes e operações em tempo real." search={{ placeholder: "Buscar" }} user={{ name: "José Wilk" }} />
          </div>
        </div>
        <div style={{ maxWidth: 420, height: 96, position: "relative", overflow: "hidden", transform: "translateZ(0)", border: "1px solid var(--border-subtle)", borderRadius: 16 }}>
          <BottomNav items={[{ id: "home", label: "Início", icon: "home" }, { id: "fin", label: "Financeiro", icon: "wallet" }, { id: "cli", label: "Clientes", icon: "users" }, { id: "cfg", label: "Ajustes", icon: "settings" }]}
            activeId="home" primary={{ icon: "sparkles", label: "Nex AI" }} />
        </div>
      </Section>
    </div>
  );
}
