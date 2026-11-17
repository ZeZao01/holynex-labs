import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Badge } from './Badge.jsx';
export function StatCard({ label, value, unit, delta, deltaLabel, icon, footnote, action, variant = 'default', className, children }) {
  const up = typeof delta === 'number' ? delta >= 0 : null;
  const deltaTxt = typeof delta === 'number' ? (delta >= 0 ? '+' : '') + delta.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : delta;
  return (
    <div className={['hn-stat', 'hn-stat--' + variant, className].filter(Boolean).join(' ')}>
      <div className="hn-stat__top">
        {icon ? <span className="hn-stat__icon"><Icon name={icon} size={16} /></span> : null}
        <span className="hn-stat__label">{label}</span>
        {action ? <span className="hn-stat__action">{action}</span> : null}
      </div>
      <div className="hn-stat__value">
        <span>{value}</span>{unit ? <small>{unit}</small> : null}
        {deltaTxt != null ? <Badge tone={variant === 'brand' ? 'neutral' : up === false ? 'danger' : 'success'} variant={variant === 'brand' ? 'solid' : 'soft'} icon={up === null ? undefined : up ? 'trending-up' : 'trending-down'}>{deltaTxt}</Badge> : null}
      </div>
      {footnote || deltaLabel ? <div className="hn-stat__foot">{footnote || deltaLabel}</div> : null}
      {children}
    </div>
  );
}
