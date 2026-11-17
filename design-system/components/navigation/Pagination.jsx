import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
function range(page, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out = [1];
  const s = Math.max(2, page - 1), e = Math.min(count - 1, page + 1);
  if (s > 2) out.push('…');
  for (let i = s; i <= e; i++) out.push(i);
  if (e < count - 1) out.push('…');
  out.push(count);
  return out;
}
export function Pagination({ page = 1, pageCount = 1, onChange, summary, className }) {
  const go = (p) => onChange && onChange(Math.max(1, Math.min(pageCount, p)));
  return (
    <div className={['hn-pager', className].filter(Boolean).join(' ')}>
      {summary ? <span className="hn-pager__summary">{summary}</span> : null}
      <div className="hn-pager__nums">
        <IconButton icon="chevron-left" label="Anterior" size="sm" onClick={() => go(page - 1)} disabled={page <= 1} />
        {range(page, pageCount).map((p, i) => p === '…' ? <span key={'e' + i} className="hn-pager__gap">…</span> : <button key={p} type="button" className={'hn-pager__num' + (p === page ? ' is-active' : '')} aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}>{p}</button>)}
        <IconButton icon="chevron-right" label="Próxima" size="sm" onClick={() => go(page + 1)} disabled={page >= pageCount} />
      </div>
    </div>
  );
}
