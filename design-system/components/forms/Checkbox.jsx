import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Checkbox({ label, description, indeterminate, className, ...rest }) {
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <label className={['hn-check', rest.disabled && 'is-disabled', className].filter(Boolean).join(' ')}>
      <input ref={ref} type="checkbox" {...rest} />
      <span className="hn-check__box" aria-hidden="true"><Icon name={indeterminate ? 'minus' : 'check'} size={13} /></span>
      {label || description ? <span className="hn-check__text">{label ? <span className="hn-check__label">{label}</span> : null}{description ? <span className="hn-check__desc">{description}</span> : null}</span> : null}
    </label>
  );
}
