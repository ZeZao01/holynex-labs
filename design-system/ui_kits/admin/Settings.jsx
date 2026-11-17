function Settings({ toast }) {
  const { Card, Button, Input, Select, Switch, Tabs, Avatar, Badge, DataTable, Dialog, Checkbox } = HN;
  const [tab, setTab] = React.useState('profile');
  const [invite, setInvite] = React.useState(false);
  const save = () => toast({ tone: 'success', title: 'Alterações salvas' });
  const team = [
    { id: 1, name: 'Rafael Nunes', email: 'rafael@holynex.com.br', role: 'Administrador', last: 'Agora' },
    { id: 2, name: 'Ana Lima', email: 'ana@holynex.com.br', role: 'Financeiro', last: 'Há 2 h' },
    { id: 3, name: 'Caio Prado', email: 'caio@holynex.com.br', role: 'Suporte', last: 'Ontem' },
  ];
  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'profile', label: 'Perfil', icon: 'user' }, { id: 'notif', label: 'Notificações', icon: 'bell' }, { id: 'security', label: 'Segurança', icon: 'shield-check' }, { id: 'team', label: 'Equipe', icon: 'users' }]} />
      {tab === 'profile' ? (
        <Card title="Informações pessoais" subtitle="Visíveis para a sua equipe.">
          <div className="hstack" style={{ gap: 14, marginBottom: 20 }}><Avatar name="Rafael Nunes" size={56} status="online" /><div className="hstack"><Button variant="secondary" size="sm" iconLeft="image">Trocar foto</Button><Button variant="ghost" size="sm">Remover</Button></div></div>
          <div className="form2">
            <Input label="Nome completo" defaultValue="Rafael Nunes" />
            <Input label="Cargo" defaultValue="Head de Operações" />
            <Input label="E-mail" defaultValue="rafael@holynex.com.br" iconLeft="mail" />
            <Input label="Telefone" defaultValue="+55 11 98765-4321" iconLeft="phone" />
            <Select label="Idioma" options={['Português (Brasil)', 'English', 'Español']} />
            <Select label="Fuso horário" options={['America/Sao_Paulo (GMT-3)', 'America/Manaus (GMT-4)']} />
          </div>
          <div className="hstack" style={{ justifyContent: 'flex-end', marginTop: 20 }}><Button variant="secondary">Cancelar</Button><Button onClick={save}>Salvar alterações</Button></div>
        </Card>
      ) : null}
      {tab === 'notif' ? (
        <Card title="Notificações" subtitle="Escolha como e quando ser avisado.">
          {[['Resumo diário por e-mail', 'Receita, novos clientes e alertas às 8h.', true], ['Alertas do Nex AI', 'Cobranças incomuns e risco de churn em tempo real.', true], ['Faturas vencidas', 'Aviso no dia seguinte ao vencimento.', true], ['Novidades do produto', 'No máximo uma vez por mês.', false]].map(([l, d, on]) => (
            <div className="set-row" key={l}><div className="cell-title"><b style={{ whiteSpace: 'normal' }}>{l}</b><small style={{ whiteSpace: 'normal' }}>{d}</small></div><Switch defaultChecked={on} aria-label={l} onChange={save} /></div>
          ))}
        </Card>
      ) : null}
      {tab === 'security' ? (
        <Card title="Segurança" subtitle="Proteja o acesso à sua conta.">
          <div className="set-row"><div className="cell-title"><b>Autenticação em dois fatores</b><small style={{ whiteSpace: 'normal' }}>Código por aplicativo autenticador a cada login.</small></div><div className="hstack"><Badge tone="success" dot>Ativo</Badge><Switch defaultChecked aria-label="2FA" /></div></div>
          <div className="set-row"><div className="cell-title"><b>Senha</b><small>Alterada há 3 meses</small></div><Button variant="secondary" size="sm">Alterar</Button></div>
          <div className="set-row"><div className="cell-title"><b>Sessões ativas</b><small>MacBook · São Paulo · agora · iPhone · São Paulo · há 2 h</small></div><Button variant="ghost" size="sm" onClick={() => toast({ tone: 'warning', title: 'Outras sessões encerradas' })}>Encerrar outras</Button></div>
        </Card>
      ) : null}
      {tab === 'team' ? (
        <Card title="Equipe" subtitle="3 de 10 assentos em uso" actions={<Button size="sm" iconLeft="user-plus" onClick={() => setInvite(true)}>Convidar</Button>}>
          <DataTable rows={team} columns={[
            { key: 'name', header: 'Membro', primary: true, render: (r) => <div className="hstack" style={{ gap: 10 }}><Avatar name={r.name} size={32} /><div className="cell-title"><b>{r.name}</b><small>{r.email}</small></div></div> },
            { key: 'role', header: 'Função', trailing: true, render: (r) => <Badge tone={r.role === 'Administrador' ? 'brand' : 'neutral'}>{r.role}</Badge> },
            { key: 'last', header: 'Último acesso', render: (r) => <span className="muted">{r.last}</span> },
          ]} />
        </Card>
      ) : null}
      <Dialog open={invite} onClose={() => setInvite(false)} icon="user-plus" title="Convidar membro" description="Ele receberá um e-mail com o link de acesso."
        footer={<><Button variant="secondary" onClick={() => setInvite(false)}>Cancelar</Button><Button onClick={() => { setInvite(false); toast({ tone: 'success', title: 'Convite enviado' }); }}>Enviar convite</Button></>}>
        <Input label="E-mail" placeholder="nome@holynex.com.br" />
        <Select label="Função" options={['Financeiro', 'Suporte', 'Administrador']} />
        <Checkbox label="Acesso ao Nex AI" description="Consome créditos do plano." defaultChecked />
      </Dialog>
    </div>
  );
}
window.Settings = Settings;
