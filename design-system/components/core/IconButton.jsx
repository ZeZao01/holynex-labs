import React from 'react';
import { Icon } from './Icon.jsx';
export function IconButton({ icon, label, variant = 'secondary', size = 'md', shape = 'circle', dot, className, ...rest }) {
  const cls = ['hn-iconbtn', 'hn-iconbtn--' + variant, 'hn-iconbtn--' + size, shape === 'square' && 'hn-iconbtn--square', className].filter(Boolean).join(' ');
  const isz = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button type="button" className={cls} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={isz} />
      {dot ? <span className="hn-iconbtn__dot" aria-hidden="true" /> : null}
    </button>
  );
}
