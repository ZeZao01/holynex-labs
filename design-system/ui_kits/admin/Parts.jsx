const HN = window.HolyNexDesignSystem_40df70;
function Rich({ text }) {
  const parts = String(text).split('**');
  return <>{parts.map((p, i) => i % 2 ? <b key={i}>{p}</b> : <React.Fragment key={i}>{p}</React.Fragment>)}</>;
}
function Orb({ size = 56, thinking }) {
  return <div className={'orb' + (thinking ? ' is-thinking' : '')} style={{ width: size, height: size }} aria-hidden="true" />;
}
function Composer({ value, onChange, onSend, placeholder = 'Pergunte qualquer coisa…', compact, autoFocus }) {
  const { IconButton, Button, Select } = HN;
  const send = () => { if (value.trim()) onSend(value.trim()); };
  return (
    <div className="composer">
      <textarea rows={compact ? 1 : 2} value={value} placeholder={placeholder} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
      <div className="composer__bar">
        {!compact ? <Select variant="pill" size="sm" options={['Contexto: Financeiro', 'Contexto: Clientes', 'Contexto: Operações']} /> : null}
        {!compact ? <Select variant="pill" size="sm" className="hide-sm" options={['Nex 2 · rápido', 'Nex 2 · raciocínio']} /> : null}
        <span className="sp" />
        <IconButton icon="mic" label="Ditado por voz" variant="ghost" size="sm" />
        <IconButton icon="paperclip" label="Anexar arquivo" variant="ghost" size="sm" />
        <Button size="sm" iconLeft="arrow-up" onClick={send} disabled={!value.trim()}>Enviar</Button>
      </div>
    </div>
  );
}
function UpgradeCard({ onClick }) {
  const { Button, Icon } = HN;
  return (
    <div className="upgrade">
      <Icon name="gem" size={22} color="var(--accent)" />
      <b>Faça upgrade</b>
      <p>Desbloqueie o Nex AI ilimitado, relatórios avançados e SSO para toda a equipe.</p>
      <Button variant="dark" size="sm" fullWidth iconRight="arrow-up-right" onClick={onClick}>Ver planos</Button>
    </div>
  );
}
const statusTone = { 'Pago': 'success', 'Ativo': 'success', 'Pendente': 'warning', 'Em teste': 'info', 'Vencida': 'danger', 'Atrasado': 'danger' };
Object.assign(window, { HN, Rich, Orb, Composer, UpgradeCard, statusTone });
