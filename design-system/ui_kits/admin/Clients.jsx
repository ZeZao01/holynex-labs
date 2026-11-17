function Clients({ toast }) {
  const { Card, StatCard, Button, IconButton, Input, Select, DataTable, Badge, Avatar, AreaChart, Pagination, Dialog, Switch, Tabs } = HN;
  const D = window.HN_DATA, f = window.HN_FMT;
  const [q, setQ] = React.useState('');
  const [plan, setPlan] = React.useState('Todos os planos');
  const [status, setStatus] = React.useState('Todos os status');
  const [sel, setSel] = React.useState([]);
  const [sort, setSort] = React.useState({ key: 'mrr', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [range, setRange] = React.useState('12m');
  let rows = D.clients.filter((c) => (!q || (c.name + c.email).toLowerCase().includes(q.toLowerCase())) && (plan === 'Todos os planos' || c.plan === plan) && (status === 'Todos os status' || c.status === status));
  rows = rows.slice().sort((a, b) => { const k = sort.key; const v = a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0; return sort.dir === 'asc' ? v : -v; });
  const g = range === '12m' ? D.growth : D.growth.slice(-6);
  const gp = range === '12m' ? D.growthPrev : D.growthPrev.slice(-6);
  const gl = range === '12m' ? D.months : D.months.slice(-6);
  return (
    <div className="page">
      <div className="grid cl-top">
        <Card title="Base de clientes" actions={<IconButton icon="more-horizontal" label="Mais" variant="ghost" size="sm" />}>
          <div className="hstack" style={{ alignItems: 'baseline', gap: 10, marginTop: -4 }}><span style={{ font: '600 32px var(--font-display)', letterSpacing: '-0.02em' }}>1.248</span><Badge tone="success" icon="trending-up">+7,3%</Badge></div>
          <div className="hstack" style={{ margin: '12px 0 16px' }}>
            <Button variant="secondary" size="sm" iconLeft="upload">Importar</Button>
            <Button size="sm" iconLeft="user-plus" onClick={() => setCreating(true)}>Novo cliente</Button>
          </div>
          <div className="tiles3">
            <StatCard icon="wallet" label="Ticket médio" value="R$ 2.480" delta={3.1} />
            <StatCard icon="user-minus" label="Churn" value="1,8%" delta={-0.4} />
            <StatCard icon="smile" label="NPS" value="72" delta={5} />
          </div>
        </Card>
        <Card title="Crescimento de clientes" subtitle="Contas ativas · tracejado = ano anterior" actions={<Tabs variant="segmented" size="sm" value={range} onChange={setRange} items={[{ id: '6m', label: '6m' }, { id: '12m', label: '12m' }]} />}>
          <AreaChart height={190} data={g} compare={gp} labels={gl} highlight={g.length - 2} format={(v) => v.toLocaleString('pt-BR') + ' contas'} />
        </Card>
      </div>
      <Card title="Todos os clientes" subtitle={rows.length + ' de ' + D.clients.length + ' contas'}>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <Input className="grow" variant="sunken" size="sm" iconLeft="search" placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select size="sm" options={['Todos os planos', 'Starter', 'Pro', 'Enterprise']} value={plan} onChange={(e) => setPlan(e.target.value)} />
          <Select size="sm" options={['Todos os status', 'Ativo', 'Pendente', 'Em teste', 'Atrasado']} value={status} onChange={(e) => setStatus(e.target.value)} />
          <Button variant="secondary" size="sm" iconLeft="calendar" className="hide-sm">1–30 nov 2026</Button>
          <Button variant="dark" size="sm" iconLeft="download" onClick={() => toast({ tone: 'success', title: 'Exportação iniciada', description: 'clientes.csv · ' + rows.length + ' linhas' })}>Exportar</Button>
        </div>
        {sel.length ? (
          <div className="bulk" style={{ marginBottom: 12 }}>
            <span style={{ flex: 1 }}>{sel.length} selecionado{sel.length > 1 ? 's' : ''}</span>
            <Button size="sm" variant="secondary" iconLeft="mail" onClick={() => { toast({ tone: 'success', title: 'E-mail enviado', description: sel.length + ' clientes' }); setSel([]); }}>Enviar e-mail</Button>
            <IconButton icon="x" label="Limpar seleção" size="sm" variant="dark" onClick={() => setSel([])} />
          </div>
        ) : null}
        <DataTable selectable selected={sel} onSelectChange={setSel} sort={sort} onSortChange={setSort} rows={rows} onRowClick={setOpen}
          columns={[
            { key: 'name', header: 'Cliente', sortable: true, primary: true, render: (r) => <div className="hstack" style={{ gap: 10, minWidth: 0 }}><Avatar name={r.name} size={32} /><div className="cell-title"><b>{r.name}</b><small>{r.email}</small></div></div> },
            { key: 'plan', header: 'Plano', sortable: true, render: (r) => <Badge tone={r.plan === 'Enterprise' ? 'brand' : 'neutral'}>{r.plan}</Badge> },
            { key: 'seats', header: 'Assentos', align: 'right', sortable: true, render: (r) => <span className="hn-num">{r.seats}</span> },
            { key: 'since', header: 'Cliente desde', sortable: true, hideOnMobile: true, render: (r) => <span className="hn-num muted">{f.date(r.since)}</span> },
            { key: 'mrr', header: 'MRR', align: 'right', sortable: true, render: (r) => <span className="hn-num" style={{ fontWeight: 600 }}>{f.brl(r.mrr)}</span> },
            { key: 'status', header: 'Status', trailing: true, render: (r) => <Badge tone={statusTone[r.status]} dot>{r.status}</Badge> },
          ]} />
        <div style={{ marginTop: 14 }}><Pagination page={page} pageCount={16} onChange={setPage} summary={'Mostrando 1–' + rows.length + ' de 1.248'} /></div>
      </Card>
      <Dialog open={!!open} onClose={() => setOpen(null)} icon="building-2" title={open && open.name} description={open && open.email}
        footer={<><Button variant="secondary" iconLeft="external-link" onClick={() => setOpen(null)}>Abrir no CRM</Button><Button iconLeft="receipt-text" onClick={() => { toast({ tone: 'success', title: 'Fatura enviada', description: 'para ' + open.name }); setOpen(null); }}>Enviar fatura</Button></>}>
        {open ? <dl className="kv" style={{ margin: 0 }}>
          <div><dt>Plano</dt><dd>{open.plan}</dd></div><div><dt>MRR</dt><dd className="hn-num">{f.brl(open.mrr)}</dd></div>
          <div><dt>Assentos</dt><dd className="hn-num">{open.seats}</dd></div><div><dt>Status</dt><dd><Badge tone={statusTone[open.status]} dot>{open.status}</Badge></dd></div>
          <div><dt>Cliente desde</dt><dd className="hn-num">{f.date(open.since)}</dd></div><div><dt>Responsável</dt><dd>{open.owner}</dd></div>
        </dl> : null}
      </Dialog>
      <Dialog open={creating} onClose={() => setCreating(false)} icon="user-plus" title="Novo cliente" description="A conta é criada em modo de teste por 14 dias."
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button><Button onClick={() => { setCreating(false); toast({ tone: 'success', title: 'Cliente criado', description: 'Convite enviado por e-mail.' }); }}>Criar cliente</Button></>}>
        <Input label="Razão social" placeholder="Empresa Ltda." />
        <div className="form2"><Input label="E-mail do responsável" placeholder="nome@empresa.com.br" /><Select label="Plano" options={['Starter', 'Pro', 'Enterprise']} defaultValue="Pro" /></div>
        <Switch label="Enviar convite agora" description="O responsável recebe o link de acesso." defaultChecked />
      </Dialog>
    </div>
  );
}
window.Clients = Clients;
