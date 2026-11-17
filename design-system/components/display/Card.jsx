import React from 'react';
export function Card({ title, subtitle, actions, variant = 'default', padding = 'md', as, className, children, ...rest }) {
  const Tag = as || 'section';
  const cls = ['hn-card', 'hn-card--' + variant, 'hn-card--pad-' + padding, className].filter(Boolean).join(' ');
  const hasHead = title || subtitle || actions;
  return (
    <Tag className={cls} {...rest}>
      {hasHead ? (
        <header className="hn-card__head">
          <div className="hn-card__titles">
            {title ? <h3 className="hn-card__title">{title}</h3> : null}
            {subtitle ? <p className="hn-card__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="hn-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}
