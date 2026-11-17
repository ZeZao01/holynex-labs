function Overview({ go, toast }) {
  const { Card, StatCard, Button, IconButton, Select, BarChart, DonutChart, DataTable, Badge, Progress, Chip, Tabs } = HN;
  const D = window.HN_DATA, f = window.HN_FMT;
  const [period, setPeriod] = React.useState('Este ano');
  const [costTab, setCostTab] = React.useState('out');
  const [q, setQ] = React.useState('');
  const cash = period === 'Este ano' ? D.cash : D.cashPrev;
  const net = cash.reduce((s, d) => s + d.up - d.down, 0);
  const seg = costTab === 'out'
    ? [{ label: 'Infraestrutura', value: 18400 }, { label: 'Pessoas', value: 12600 }, { label: 'Licenças', value: 4200 }, { label: 'Outros', value: 2800 }]
    : [{ label: 'Assinaturas', value: 61200 }, { label: 'Consultoria', value: 12900 }, { label: 'Add-ons', value: 4900 }];
  const segTotal = seg.reduce((s, x) => s + x.value, 0);
  return (
    <div className="page">
      <div className="grid ov-top">
        <StatCard variant="brand" icon="banknote" label="Receita recorrente (MRR)" value="R$ 86.240" unit="BRL" delta="+8,1%" footnote="vs. outubro · 214 assinaturas ativas"
          action={<IconButton icon="plus" label="Nova cobrança" size="sm" onClick={() => go('invoices')} />}>
          <div className="hstack" style={{ marginTop: 2 }}>
            <Button variant="secondary" size="sm" iconRight="download" onClick={() => toast({ tone: 'success', title: 'Relatório gerado', description: 'MRR_nov-2026.pdf foi baixado.' })}>Relatório</Button>
            <Button variant="dark" size="sm" iconRight="arrow-up-right" onClick={() => go('invoices')}>Faturar</Button>
          </div>
        </StatCard>
        <Card className="ov-ind" title="Indicadores do mês" actions={<Button variant="ghost" size="sm" iconLeft="plus" className="hide-sm">Adicionar</Button>}>
          <div className="tiles3">
            <StatCard icon="arrow-down-left" label="Entradas" value="R$ 79.000" delta={12.4} />
            <StatCard icon="arrow-up-right" label="Saídas" value="R$ 38.000" delta={-17} />
            <StatCard icon="percent" label="Margem" value="51,9%" delta={6.2} />
          </div>
        </Card>
        <Card title="Saúde da operação" actions={<IconButton icon="more-horizontal" label="Mais opções" variant="ghost" size="sm" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="between"><div><div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Nota geral</div><div style={{ font: '700 22px var(--font-display)', letterSpacing: '-0.015em' }}>Excelente</div></div><span className="hn-num" style={{ fontSize: 22 }}>92%</span></div>
            <Progress value={92} variant="split" size="lg" />
            <div className="between" style={{ fontSize: 12 }}><span className="muted">Uptime <b style={{ color: 'var(--text-primary)' }}>99,98%</b></span><span className="muted">Inadimplência <b style={{ color: 'var(--danger-700)' }}>4,1%</b></span></div>
          </div>
        </Card>
      </div>
      <div className="grid ov-mid">
        <Card title="Fluxo de caixa" actions={<Select variant="pill" size="sm" options={['Este ano', 'Ano passado']} value={period} onChange={(e) => setPeriod(e.target.value)} />}>
          <div style={{ marginTop: -6, marginBottom: 6 }}><div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Saldo do período</div><div style={{ font: '600 26px var(--font-display)', letterSpacing: '-0.015em' }}>{f.brl(net)}</div></div>
          <BarChart height={200} data={cash} highlight={10} format={f.k} />
        </Card>
        <Card title="Nex AI" subtitle="Seu analista de operações" actions={<IconButton icon="maximize-2" label="Abrir Nex AI" variant="ghost" size="sm" onClick={() => go('ai')} />}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 0 14px' }}>
            <Orb size={56} />
            <div style={{ font: '600 15px var(--font-display)' }}>Como posso ajudar?</div>
            <div className="hstack" style={{ flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              {D.suggestions.slice(0, 3).map((s) => <Chip key={s.title} size="sm" icon={s.icon} onClick={() => go('ai', s.prompt)}>{s.prompt}</Chip>)}
            </div>
          </div>
          <Composer compact value={q} onChange={setQ} onSend={(t) => { setQ(''); go('ai', t); }} />
        </Card>
      </div>
      <div className="grid ov-bot">
        <Card className="ov-table" title="Faturas recentes" actions={<><Select variant="pill" size="sm" options={['Este mês', 'Mês passado']} /><IconButton icon="arrow-right" label="Ver todas" size="sm" onClick={() => go('invoices')} /></>}>
          <DataTable density="sm" rows={D.invoices.slice(0, 5)} onRowClick={() => go('invoices')}
            columns={[
              { key: 'client', header: 'Cliente', primary: true, render: (r) => <div className="cell-title"><b>{r.client}</b><small>{r.kind}</small></div> },
              { key: 'method', header: 'Método', render: (r) => <span className="muted">{r.method}</span> },
              { key: 'date', header: 'Data', render: (r) => <div className="cell-title"><span className="hn-num" style={{ fontSize: 13 }}>{f.date(r.date)}</span><small className="hn-num">{r.time}</small></div> },
              { key: 'amount', header: 'Valor', align: 'right', trailing: true, render: (r) => <span className="hn-num" style={{ fontWeight: 600 }}>{f.brl2(r.amount)}</span> },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
            ]} />
        </Card>
        <Card title="Composição" actions={<Select variant="pill" size="sm" options={['Novembro']} />}>
          <Tabs fullWidth size="sm" value={costTab} onChange={setCostTab} items={[{ id: 'in', label: 'Entradas', meta: '(79k)' }, { id: 'out', label: 'Saídas', meta: '(38k)' }]} />
          <div style={{ marginTop: 16 }}><DonutChart size={140} thickness={16} label={costTab === 'out' ? 'Total de saídas' : 'Total de entradas'} value={f.k(segTotal)} segments={seg} format={f.k} /></div>
        </Card>
        <Card title="Uso da plataforma" subtitle="Plano Enterprise · renova em 12/12">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Progress label="Chamadas de API" value={82} showValue tone="brand" />
            <Progress label="Armazenamento" value={46} showValue tone="ink" />
            <Progress label="Assentos" value={61} showValue tone="success" />
            <Progress label="Créditos Nex AI" value={94} showValue tone="warning" />
            <Button variant="soft" size="sm" fullWidth iconLeft="gem" onClick={() => go('settings')}>Gerenciar plano</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
window.Overview = Overview;
