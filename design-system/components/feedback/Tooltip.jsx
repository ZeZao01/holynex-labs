import React from 'react';
export function Tooltip({ label, side = 'top', children, className }) {
  const [show, setShow] = React.useState(false);
  const id = React.useId();
  return (
    <span className={['hn-tip-anchor', className].filter(Boolean).join(' ')} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onFocus={() => setShow(true)} onBlur={() => setShow(false)} aria-describedby={show ? id : undefined}>
      {children}
      {show ? <span role="tooltip" id={id} className={'hn-tip hn-tip--' + side}>{label}</span> : null}
    </span>
  );
}
