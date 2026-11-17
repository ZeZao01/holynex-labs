import React from 'react';
export function DonutChart({ segments = [], size = 160, thickness = 18, gap = 3, label, value, legend = true, format = (v) => v, className }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
  return (
    <div className={['hn-donut', className].filter(Boolean).join(' ')}>
      <div className="hn-donut__ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} aria-hidden="true">
          {segments.map((s, i) => {
            const len = (s.value / total) * C;
            const dash = Math.max(0, len - gap);
            const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color || palette[i % palette.length]} strokeWidth={thickness} strokeDasharray={dash + ' ' + (C - dash)} strokeDashoffset={-acc} transform={'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'} />;
            acc += len;
            return el;
          })}
        </svg>
        {label || value ? <div className="hn-donut__center">{label ? <span>{label}</span> : null}{value ? <strong className="hn-num">{value}</strong> : null}</div> : null}
      </div>
      {legend ? (
        <ul className="hn-donut__legend">
          {segments.map((s, i) => (
            <li key={i}>
              <span className="hn-donut__pct" style={{ background: s.color || palette[i % palette.length], color: i === 0 ? '#fff' : 'var(--ink-950)' }}>{Math.round((s.value / total) * 100)}%</span>
              <span className="hn-donut__name">{s.label}</span>
              <span className="hn-num">{format(s.value)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
