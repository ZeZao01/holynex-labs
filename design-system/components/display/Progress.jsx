import React from 'react';
export function Progress({ value = 0, max = 100, variant = 'bar', tone = 'brand', label, showValue, dots = 10, size = 'md', className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const head = label || showValue ? <div className="hn-progress__head">{label ? <span>{label}</span> : <span />}{showValue ? <span className="hn-num">{Math.round(pct)}%</span> : null}</div> : null;
  if (variant === 'dots') {
    const on = Math.round((pct / 100) * dots);
    return (
      <div className={['hn-progress', className].filter(Boolean).join(' ')} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        {head}
        <div className="hn-progress__dots">{Array.from({ length: dots }).map((_, i) => <span key={i} className={i < on ? 'is-on hn-progress__dot--' + tone : ''} />)}</div>
      </div>
    );
  }
  return (
    <div className={['hn-progress', 'hn-progress--' + size, className].filter(Boolean).join(' ')} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      {head}
      <div className={'hn-progress__track' + (variant === 'split' ? ' is-split' : '')}>
        <span className={'hn-progress__fill hn-progress__fill--' + tone} style={{ width: pct + '%' }} />
        {variant === 'split' ? <span className="hn-progress__rest" /> : null}
      </div>
    </div>
  );
}
