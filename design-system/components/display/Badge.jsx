import React from 'react';
export function Badge({ tone = 'neutral', variant = 'soft', dot, icon, className, children, ...rest }) {
  const cls = ['hn-badge', 'hn-badge--' + tone, variant === 'solid' && 'hn-badge--solid', variant === 'outline' && 'hn-badge--outline', className].filter(Boolean).join(' ');
  return (
    <span className={cls} {...rest}>
      {dot ? <span className="hn-badge__dot" aria-hidden="true" /> : null}
      {icon ? <i className={'icon-' + icon + ' hn-icon'} style={{ fontSize: 12 }} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
