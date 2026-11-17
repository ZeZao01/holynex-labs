import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Chip({ selected, icon, onRemove, onClick, size = 'md', className, children, ...rest }) {
  const cls = ['hn-chip', 'hn-chip--' + size, selected && 'is-selected', onClick && 'is-clickable', className].filter(Boolean).join(' ');
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag type={onClick ? 'button' : undefined} className={cls} onClick={onClick} aria-pressed={onClick ? !!selected : undefined} {...rest}>
      {icon ? <Icon name={icon} size={14} /> : null}
      <span>{children}</span>
      {onRemove ? <span role="button" tabIndex={0} aria-label="Remover" className="hn-chip__x" onClick={(e) => { e.stopPropagation(); onRemove(e); }}><Icon name="x" size={12} /></span> : null}
    </Tag>
  );
}
