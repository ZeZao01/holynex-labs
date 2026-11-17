import React from 'react';
export function Avatar({ src, name = '', size = 32, status, className, style }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  return (
    <span className={['hn-avatar', className].filter(Boolean).join(' ')} style={{ width: size, height: size, fontSize: Math.round(size * 0.38), ...style }} title={name || undefined}>
      {src ? <img src={src} alt={name} /> : <span aria-hidden={!!name}>{initials}</span>}
      {status ? <span className={'hn-avatar__status hn-avatar__status--' + status} aria-label={status} /> : null}
    </span>
  );
}
