const ROUTES = {
  overview: { title: 'Visão geral', subtitle: 'Acompanhe receita, clientes e operações em tempo real.' },
  ai: { title: 'Nex AI', subtitle: 'Insights, previsões e respostas sobre a sua operação.' },
  clients: { title: 'Clientes', subtitle: 'Gerencie contas, planos e o ciclo de vida de cada cliente.' },
  invoices: { title: 'Faturas', subtitle: 'Emita, acompanhe e concilie cobranças.' },
  settings: { title: 'Configurações', subtitle: 'Perfil, notificações, segurança e equipe.' },
};
function App() {
  const { Sidebar, Topbar, BottomNav, IconButton, Toast } = HN;
  const initial = (location.hash || '').replace('#', '');
  const [route, setRoute] = React.useState(ROUTES[initial] ? initial : 'overview');
  const [menu, setMenu] = React.useState(false);
  const [seed, setSeed] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);
  const go = (r, prompt) => { setRoute(r); setMenu(false); if (prompt) setSeed(prompt); history.replaceState(null, '', '#' + r); window.scrollTo(0, 0); };
  const toast = (t) => { const id = Date.now() + Math.random(); setToasts((x) => x.concat({ ...t, id })); setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4200); };
  const sections = [
    { title: 'Menu principal', items: [{ id: 'overview', label: 'Visão geral', icon: 'layout-dashboard' }, { id: 'ai', label: 'Nex AI', icon: 'sparkles' }, { id: 'clients', label: 'Clientes', icon: 'users' }, { id: 'invoices', label: 'Faturas', icon: 'receipt-text', badge: 2 }] },
    { title: 'Preferências', items: [{ id: 'settings', label: 'Configurações', icon: 'settings' }] },
  ];
  const R = ROUTES[route];
  const props = { go, toast };
  return (
    <div className="app">
      <Sidebar brand={{ logo: (window.__resources && window.__resources.logoMark) || '../../assets/logo-mark.png', name: 'HolyNex' }} account={{ name: 'Rafael Nunes', subtitle: 'HolyNex Labs · Admin' }} sections={sections} activeId={route} onNavigate={go} open={menu} onClose={() => setMenu(false)} footer={<UpgradeCard onClick={() => go('settings')} />} />
      <div className="main">
        <Topbar title={R.title} subtitle={R.subtitle} search={{}} onMenuClick={() => setMenu(true)}
          actions={<><IconButton icon="bell" label="Notificações" dot onClick={() => toast({ tone: 'brand', title: 'Nex AI encontrou 2 cobranças duplicadas', description: 'Verde Agro e Studio Ária' })} /><IconButton icon="settings" label="Configurações" className="hide-sm" onClick={() => go('settings')} /></>}
          user={{ name: 'Rafael Nunes', status: 'online', onClick: () => go('settings') }} />
        {route === 'overview' ? <Overview {...props} /> : null}
        {route === 'ai' ? <Assistant {...props} seed={seed} clearSeed={() => setSeed(null)} /> : null}
        {route === 'clients' ? <Clients {...props} /> : null}
        {route === 'invoices' ? <Invoices {...props} /> : null}
        {route === 'settings' ? <Settings {...props} /> : null}
      </div>
      <BottomNav activeId={route} onNavigate={go} primary={{ icon: 'sparkles', label: 'Nex AI', onClick: () => go('ai') }}
        items={[{ id: 'overview', label: 'Início', icon: 'layout-dashboard' }, { id: 'clients', label: 'Clientes', icon: 'users' }, { id: 'invoices', label: 'Faturas', icon: 'receipt-text' }, { id: 'settings', label: 'Ajustes', icon: 'settings' }]} />
      <div className="toasts">{toasts.map((t) => <Toast key={t.id} {...t} onClose={() => setToasts((x) => x.filter((y) => y.id !== t.id))} />)}</div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
