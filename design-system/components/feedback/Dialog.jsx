import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
export function Dialog({ open, onClose, title, description, icon, footer, size = 'md', children, className }) {
  React.useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="hn-dialog-root">
      <div className="hn-scrim" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} className={['hn-dialog', 'hn-dialog--' + size, className].filter(Boolean).join(' ')}>
        <div className="hn-dialog__grab" aria-hidden="true" />
        <div className="hn-dialog__head">
          {icon ? <span className="hn-dialog__icon"><i className={'icon-' + icon + ' hn-icon'} style={{ fontSize: 20 }} aria-hidden="true" /></span> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title ? <h2 className="hn-dialog__title">{title}</h2> : null}
            {description ? <p className="hn-dialog__desc">{description}</p> : null}
          </div>
          {onClose ? <IconButton icon="x" label="Fechar" variant="ghost" size="sm" onClick={onClose} /> : null}
        </div>
        {children ? <div className="hn-dialog__body">{children}</div> : null}
        {footer ? <div className="hn-dialog__foot">{footer}</div> : null}
      </div>
    </div>
  );
}
