import React from 'react';
export function Switch({ label, description, size = 'md', className, ...rest }) {
  return (
    <label className={['hn-switch', 'hn-switch--' + size, rest.disabled && 'is-disabled', className].filter(Boolean).join(' ')}>
      <input type="checkbox" role="switch" {...rest} />
      <span className="hn-switch__track" aria-hidden="true"><span className="hn-switch__thumb" /></span>
      {label || description ? <span className="hn-check__text">{label ? <span className="hn-check__label">{label}</span> : null}{description ? <span className="hn-check__desc">{description}</span> : null}</span> : null}
    </label>
  );
}
