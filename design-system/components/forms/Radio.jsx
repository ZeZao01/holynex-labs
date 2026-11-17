import React from 'react';
export function Radio({ label, description, className, ...rest }) {
  return (
    <label className={['hn-check', 'hn-radio', rest.disabled && 'is-disabled', className].filter(Boolean).join(' ')}>
      <input type="radio" {...rest} />
      <span className="hn-radio__dot" aria-hidden="true" />
      {label || description ? <span className="hn-check__text">{label ? <span className="hn-check__label">{label}</span> : null}{description ? <span className="hn-check__desc">{description}</span> : null}</span> : null}
    </label>
  );
}
