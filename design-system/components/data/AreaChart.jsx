import React from 'react';
export function AreaChart({ data = [], labels = [], height = 180, color = 'var(--accent)', format = (v) => v, highlight, compare, className }) {
  const [hov, setHov] = React.useState(null);
  const ref = React.useRef(null);
  const W = 1000, H = 100;
  const all = data.concat(compare || []);
  const min = Math.min(...all), max = Math.max(...all);
  const pad = (max - min) * 0.12 || 1;
  const lo = min - pad, hi = max + pad;
  const pt = (v, i, n) => [(i / (n - 1)) * W, H - ((v - lo) / (hi - lo)) * H];
  const line = (arr) => arr.map((v, i) => { const [x, y] = pt(v, i, arr.length); if (i === 0) return 'M' + x + ',' + y; const [px, py] = pt(arr[i - 1], i - 1, arr.length); const cx = (px + x) / 2; return 'C' + cx + ',' + py + ' ' + cx + ',' + y + ' ' + x + ',' + y; }).join(' ');
  const d = line(data);
  const gid = React.useId().replace(/:/g, '');
  const active = hov ?? highlight;
  const move = (e) => { const r = ref.current.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)); setHov(Math.max(0, Math.min(data.length - 1, i))); };
  const ap = active != null ? pt(data[active], active, data.length) : null;
  return (
    <div className={['hn-area', className].filter(Boolean).join(' ')}>
      <div className="hn-area__plot" style={{ height }} ref={ref} onMouseMove={move} onMouseLeave={() => setHov(null)}>
        <svg viewBox={'0 0 ' + W + ' ' + H} preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="hn-area__grid" vectorEffect="non-scaling-stroke" />)}
          <path d={d + ' L' + W + ',' + H + ' L0,' + H + ' Z'} fill={'url(#' + gid + ')'} />
          {compare ? <path d={line(compare)} fill="none" className="hn-area__compare" vectorEffect="non-scaling-stroke" /> : null}
          <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {ap ? <line x1={ap[0]} x2={ap[0]} y1={ap[1]} y2={H} className="hn-area__cursor" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        {ap ? <span className="hn-area__dot" style={{ left: (ap[0] / W) * 100 + '%', top: (ap[1] / H) * 100 + '%', borderColor: color }} /> : null}
        {ap ? <div className={'hn-area__tip' + (active > data.length * 0.6 ? ' is-left' : '')} style={{ left: (ap[0] / W) * 100 + '%', top: (ap[1] / H) * 100 + '%' }}><em>{labels[active]}</em><b className="hn-num">{format(data[active])}</b></div> : null}
      </div>
      {labels.length ? <div className="hn-bars__x">{labels.map((l, i) => <span key={i}>{l}</span>)}</div> : null}
    </div>
  );
}
