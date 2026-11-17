import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Input({ label, hint, error, iconLeft, kbd, suffix, size = 'md', variant = 'default', id, className, style, ...rest }) {
  const autoId = React.useId();
  const fid = id || autoId;
  const box = ['hn-input', 'hn-input--' + size, variant === 'sunken' && 'hn-input--sunken', error && 'is-error', rest.disabled && 'is-disabled'].filter(Boolean).join(' ');
  return (
    <div className={['hn-field', className].filter(Boolean).join(' ')} style={style}>
      {label ? <label className="hn-label" htmlFor={fid}>{label}</label> : null}
      <div className={box}>
        {iconLeft ? <Icon name={iconLeft} size={16} color="var(--text-secondary)" /> : null}
        <input id={fid} aria-invalid={error ? true : undefined} {...rest} />
        {suffix ? <span className="hn-input__suffix">{suffix}</span> : null}
        {kbd ? <span className="hn-kbds">{[].concat(kbd).map((k, i) => <kbd key={i} className="hn-kbd">{k}</kbd>)}</span> : null}
      </div>
      {error ? <span className="hn-hint hn-hint--error">{error}</span> : hint ? <span className="hn-hint">{hint}</span> : null}
    </div>
  );
}
