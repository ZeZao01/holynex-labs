import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Select({ label, hint, error, options = [], iconLeft, size = 'md', variant = 'default', id, className, style, placeholder, ...rest }) {
  const autoId = React.useId();
  const fid = id || autoId;
  const box = ['hn-input', 'hn-select', 'hn-input--' + size, variant === 'sunken' && 'hn-input--sunken', variant === 'pill' && 'hn-select--pill', error && 'is-error'].filter(Boolean).join(' ');
  return (
    <div className={['hn-field', className].filter(Boolean).join(' ')} style={style}>
      {label ? <label className="hn-label" htmlFor={fid}>{label}</label> : null}
      <div className={box}>
        {iconLeft ? <Icon name={iconLeft} size={16} color="var(--text-secondary)" /> : null}
        <select id={fid} aria-invalid={error ? true : undefined} {...rest}>
          {placeholder ? <option value="" disabled>{placeholder}</option> : null}
          {options.map((o) => { const v = typeof o === 'string' ? { value: o, label: o } : o; return <option key={v.value} value={v.value}>{v.label}</option>; })}
        </select>
        <Icon name="chevron-down" size={16} color="var(--text-secondary)" className="hn-select__chev" />
      </div>
      {error ? <span className="hn-hint hn-hint--error">{error}</span> : hint ? <span className="hn-hint">{hint}</span> : null}
    </div>
  );
}
