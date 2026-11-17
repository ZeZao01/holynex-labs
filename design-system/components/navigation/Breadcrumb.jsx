import React from 'react';
export function Breadcrumb({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={['hn-crumbs', className].filter(Boolean).join(' ')}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.href && !last ? <a href={it.href} onClick={it.onClick}>{it.label}</a> : <span aria-current={last ? 'page' : undefined} onClick={it.onClick} className={it.onClick && !last ? 'is-link' : undefined}>{it.label}</span>}
            {!last ? <span className="hn-crumbs__sep" aria-hidden="true">/</span> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
