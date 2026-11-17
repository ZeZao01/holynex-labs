import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function BottomNav({ items = [], activeId, onNavigate, primary, className }) {
  const mid = Math.ceil(items.length / 2);
  const btn = (it) => (
    <button key={it.id} type="button" className={'hn-bnav__item' + (it.id === activeId ? ' is-active' : '')} aria-current={it.id === activeId ? 'page' : undefined} onClick={() => onNavigate && onNavigate(it.id)}>
      <Icon name={it.icon} size={20} />
      <span>{it.label}</span>
    </button>
  );
  return (
    <nav className={['hn-bnav', className].filter(Boolean).join(' ')} aria-label="Navegação">
      {items.slice(0, mid).map(btn)}
      {primary ? <button type="button" className="hn-bnav__primary" onClick={primary.onClick} aria-label={primary.label}><Icon name={primary.icon} size={22} /></button> : null}
      {items.slice(mid).map(btn)}
    </nav>
  );
}
