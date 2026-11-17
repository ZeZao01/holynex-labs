import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Avatar } from '../display/Avatar.jsx';
export function Sidebar({ brand = {}, account, sections = [], activeId, onNavigate, footer, open, onClose, collapsed, className }) {
  const cls = ['hn-sidebar', open && 'is-open', collapsed && 'is-collapsed', className].filter(Boolean).join(' ');
  return (
    <>
      <div className={'hn-sidebar__scrim' + (open ? ' is-open' : '')} onClick={onClose} aria-hidden="true" />
      <aside className={cls} aria-label="Navegação principal">
        <div className="hn-sidebar__brand">
          {brand.logo ? <img src={brand.logo} alt="" /> : null}
          <span className="hn-sidebar__name">{brand.name || 'HolyNex'}</span>
          {onClose ? <button type="button" className="hn-sidebar__close" onClick={onClose} aria-label="Fechar menu"><Icon name="x" size={18} /></button> : null}
        </div>
        {account ? (
          <button type="button" className="hn-sidebar__account" onClick={account.onClick}>
            <Avatar name={account.name} src={account.avatar} size={32} />
            <span className="hn-sidebar__acct-text"><strong>{account.name}</strong><small>{account.subtitle}</small></span>
            <Icon name="chevrons-up-down" size={14} color="var(--text-tertiary)" />
          </button>
        ) : null}
        <nav className="hn-sidebar__nav">
          {sections.map((s, si) => (
            <div key={si} className="hn-sidebar__section">
              {s.title ? <div className="hn-sidebar__title">{s.title}</div> : null}
              {s.items.map((it) => {
                const active = it.id === activeId;
                return (
                  <button key={it.id} type="button" title={collapsed ? it.label : undefined} className={'hn-navitem' + (active ? ' is-active' : '')} aria-current={active ? 'page' : undefined} onClick={() => onNavigate && onNavigate(it.id)}>
                    <Icon name={it.icon} size={18} />
                    <span className="hn-navitem__label">{it.label}</span>
                    {it.badge != null ? <span className="hn-navitem__badge">{it.badge}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        {footer ? <div className="hn-sidebar__footer">{footer}</div> : null}
      </aside>
    </>
  );
}
