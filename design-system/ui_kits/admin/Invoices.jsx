function Invoices({ toast }) {
  const { Card, StatCard, Button, Input, DataTable, Badge, Tabs, IconButton } = HN;
  const D = window.HN_DATA, f = window.HN_FMT;
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const map = { all: null, paid: 'Pago', pending: 'Pendente', overdue: 'Vencida' };
  const count = (s) => D.invoices.filter((i) => i.status === s).length;
  const rows = D.invoices.filter((i) => (!map[tab] || i.status === map[tab]) && (!q || (i.id + i.client).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="page">
      <div className="tiles4">
        <StatCard variant="card" icon="receipt-text" label="Faturado em nov" value="R$ 40.810" delta={9.6} />
        <StatCard variant="card" icon="circle-check" label="Recebido" value="R$ 35.340" footnote="5 faturas" />
        <StatCard variant="card" icon="clock" label="Em aberto" value="R$ 2.980" footnote="2 faturas" />
        <StatCard variant="card" icon="triangle-alert" label="Vencido" value="R$ 2.490" footnote="Nimbus Educação" />
      </div>
      <Card title="Faturas" actions={<Button size="sm" iconLeft="plus" onClick={() => toast({ tone: 'brand', title: 'Rascunho criado', description: 'INV-2049 · preencha os itens' })}>Nova fatura</Button>}>
        <div className="between" style={{ flexWrap: 'wrap', marginBottom: 12, gap: 10 }}>
          <Tabs value={tab} onChange={setTab} items={[{ id: 'all', label: 'Todas', meta: D.invoices.length }, { id: 'paid', label: 'Pagas', meta: count('Pago') }, { id: 'pending', label: 'Pendentes', meta: count('Pendente') }, { id: 'overdue', label: 'Vencidas', meta: count('Vencida') }]} />
          <Input variant="sunken" size="sm" iconLeft="search" placeholder="Buscar fatura" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240, maxWidth: '100%' }} />
        </div>
        <DataTable rows={rows}
          columns={[
            { key: 'id', header: 'Fatura', render: (r) => <span className="hn-num" style={{ fontWeight: 600 }}>#{r.id}</span>, hideOnMobile: true },
            { key: 'client', header: 'Cliente', primary: true, render: (r) => <div className="cell-title"><b>{r.client}</b><small>{r.kind}</small></div> },
            { key: 'method', header: 'Método', render: (r) => <span className="muted">{r.method}</span> },
            { key: 'date', header: 'Emissão', render: (r) => <span className="hn-num">{f.date(r.date)}</span> },
            { key: 'amount', header: 'Valor', align: 'right', trailing: true, render: (r) => <span className="hn-num" style={{ fontWeight: 600 }}>{f.brl2(r.amount)}</span> },
            { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
            { key: 'act', header: '', align: 'right', hideOnMobile: true, render: (r) => <IconButton icon="download" label={'Baixar ' + r.id} variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toast({ tone: 'success', title: r.id + '.pdf baixado' }); }} /> },
          ]} />
      </Card>
    </div>
  );
}
window.Invoices = Invoices;
