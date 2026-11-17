import React from 'react';
import { Icon } from './Icon.jsx';
export function Button({ variant = 'primary', size = 'md', shape = 'pill', iconLeft, iconRight, fullWidth, loading, disabled, as, className, children, ...rest }) {
  const Tag = as || (rest.href ? 'a' : 'button');
  const cls = ['hn-btn', 'hn-btn--' + variant, 'hn-btn--' + size, shape === 'rounded' && 'hn-btn--rounded', fullWidth && 'hn-btn--full', loading && 'is-loading', className].filter(Boolean).join(' ');
  const isz = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  return (
    <Tag className={cls} disabled={Tag === 'button' ? (disabled || loading) : undefined} aria-disabled={disabled || undefined} aria-busy={loading || undefined} type={Tag === 'button' ? (rest.type || 'button') : undefined} {...rest}>
      {loading ? <span className="hn-spinner" aria-hidden="true" /> : iconLeft ? <Icon name={iconLeft} size={isz} /> : null}
      {children != null && <span className="hn-btn__label">{children}</span>}
      {iconRight && !loading ? <Icon name={iconRight} size={isz} /> : null}
    </Tag>
  );
}
