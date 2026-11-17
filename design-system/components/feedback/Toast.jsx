import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
const ICONS = { success: 'circle-check', warning: 'triangle-alert', danger: 'circle-x', info: 'info', brand: 'sparkles', neutral: 'bell' };
export function Toast({ tone = 'neutral', title, description, action, onClose, icon, className }) {
  return (
    <div role="status" className={['hn-toast', 'hn-toast--' + tone, className].filter(Boolean).join(' ')}>
      <span className="hn-toast__icon"><i className={'icon-' + (icon || ICONS[tone]) + ' hn-icon'} style={{ fontSize: 18 }} aria-hidden="true" /></span>
      <div className="hn-toast__text">
        {title ? <strong>{title}</strong> : null}
        {description ? <span>{description}</span> : null}
      </div>
      {action ? <div className="hn-toast__action">{action}</div> : null}
      {onClose ? <IconButton icon="x" label="Dispensar" variant="ghost" size="sm" onClick={onClose} /> : null}
    </div>
  );
}
