import React from 'react';
export function Icon({ name, size = 18, color, label, style, className, ...rest }) {
  const cls = ['icon-' + name, 'hn-icon', className].filter(Boolean).join(' ');
  return <i className={cls} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    style={{ fontSize: size, width: size, height: size, color, ...style }} {...rest} />;
}
