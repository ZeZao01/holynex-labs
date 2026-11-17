function Assistant({ seed, clearSeed, toast }) {
  const { Card, Button } = HN;
  const D = window.HN_DATA;
  const [msgs, setMsgs] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const endRef = React.useRef(null);
  const ask = (t) => {
    setMsgs((m) => m.concat({ me: true, text: t }));
    setQ(''); setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs((m) => m.concat({ me: false, text: D.answers[t] || 'Analisei os dados de novembro: a receita está **12,4% acima** de outubro e não há alertas críticos. Quer que eu detalhe por cliente ou por produto?' }));
    }, 1100);
  };
  React.useEffect(() => { if (seed) { ask(seed); clearSeed(); } }, [seed]);
  React.useEffect(() => { const el = endRef.current; if (el && el.parentElement) { const sc = document.scrollingElement; sc.scrollTop = sc.scrollHeight; } }, [msgs, thinking]);
  const empty = msgs.length === 0;
  return (
    <div className="page">
      <Card padding="lg" style={{ minHeight: 'calc(100dvh - 140px)', display: 'flex', flexDirection: 'column' }}>
        <div className="hstack" style={{ justifyContent: 'flex-end' }}>
          {!empty ? <Button variant="ghost" size="sm" iconLeft="rotate-ccw" onClick={() => setMsgs([])}>Nova conversa</Button> : null}
          <Button variant="secondary" size="sm" iconLeft="download" onClick={() => toast({ tone: 'success', title: 'Conversa exportada' })}>Exportar</Button>
          <Button variant="primary" size="sm" iconLeft="sparkles">Nex Pro</Button>
        </div>
        {empty ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, width: '100%', maxWidth: 720, margin: '0 auto', padding: '24px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              <Orb size={76} />
              <div style={{ font: '500 16px var(--font-display)', color: 'var(--text-secondary)', marginTop: 6 }}>Bom te ver, Rafael!</div>
              <h2 style={{ margin: 0, font: '600 26px/1.2 var(--font-display)', letterSpacing: '-0.02em', textWrap: 'balance' }}>Como posso ajudar sua operação hoje?</h2>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 420, textWrap: 'pretty' }}>Acompanhe o fluxo de caixa, receba alertas de cobranças incomuns e preveja o churn — tudo em um só lugar.</p>
            </div>
            <div style={{ width: '100%' }}><Composer value={q} onChange={setQ} onSend={ask} /></div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>Comece com um exemplo</div>
              <div className="sugg">
                {D.suggestions.map((s) => (
                  <button key={s.title} type="button" className="sugg-card" onClick={() => ask(s.prompt)}>
                    <b>{s.title}</b><p>{s.text}</p><span className="more">Perguntar <i className="icon-arrow-right hn-icon" style={{ fontSize: 13 }} /></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 760, margin: '0 auto', paddingTop: 16 }}>
            <div className="chat" style={{ flex: 1 }}>
              {msgs.map((m, i) => (
                <div key={i} className={'msg ' + (m.me ? 'msg--me' : 'msg--ai')}>
                  {m.me ? null : <Orb size={28} />}
                  <div className="bubble"><Rich text={m.text} /></div>
                </div>
              ))}
              {thinking ? <div className="msg msg--ai"><Orb size={28} thinking /><div className="bubble"><span className="typing"><i /><i /><i /></span></div></div> : null}
              <div ref={endRef} />
            </div>
            <div style={{ position: 'sticky', bottom: 'calc(env(safe-area-inset-bottom) + 12px)', marginTop: 16 }}><Composer value={q} onChange={setQ} onSend={ask} autoFocus /></div>
          </div>
        )}
      </Card>
    </div>
  );
}
window.Assistant = Assistant;
