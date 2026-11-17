import React from 'react';
export function Tabs({ items = [], value, onChange, variant = 'underline', size = 'md', fullWidth, className }) {
  const cls = ['hn-tabs', 'hn-tabs--' + variant, 'hn-tabs--' + size, fullWidth && 'hn-tabs--full', className].filter(Boolean).join(' ');
  return (
    <div className={cls} role="tablist">
      {items.map((it) => {
        const t = typeof it === 'string' ? { id: it, label: it } : it;
        const active = t.id === value;
        return (
          <button key={t.id} type="button" role="tab" aria-selected={active} className={'hn-tab' + (active ? ' is-active' : '')} onClick={() => onChange && onChange(t.id)}>
            {t.icon ? <i className={'icon-' + t.icon + ' hn-icon'} style={{ fontSize: 15 }} aria-hidden="true" /> : null}
            <span>{t.label}</span>
            {t.meta != null ? <span className="hn-tab__meta">{t.meta}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
