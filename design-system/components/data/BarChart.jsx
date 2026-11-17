import React from 'react';
export function BarChart({ data = [], height = 200, series = ['Entradas', 'Saídas'], format = (v) => v, ticks, highlight, onHighlight, showLegend = true, className }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.up || 0, d.down || 0)));
  const hasDown = data.some((d) => d.down);
  const tk = ticks || (hasDown ? [max, max / 2, 0, -max / 2, -max] : [max, max * 0.75, max / 2, max / 4, 0]);
  const [hov, setHov] = React.useState(null);
  const active = hov ?? highlight;
  const half = hasDown ? 50 : 100;
  return (
    <div className={['hn-bars', className].filter(Boolean).join(' ')}>
      {showLegend ? <div className="hn-bars__legend"><span><i className="sw sw--a" />{series[0]}</span>{hasDown ? <span><i className="sw sw--b" />{series[1]}</span> : null}</div> : null}
      <div className="hn-bars__plot" style={{ height }}>
        <div className="hn-bars__y">{tk.map((t, i) => <span key={i}>{format(Math.round(t))}</span>)}</div>
        <div className="hn-bars__area">
          {tk.map((t, i) => <div key={i} className={'hn-bars__grid' + (t === 0 ? ' is-zero' : '')} style={{ top: (i / (tk.length - 1)) * 100 + '%' }} />)}
          <div className="hn-bars__cols">
            {data.map((d, i) => (
              <div key={i} className={'hn-bars__col' + (active === i ? ' is-active' : '') + (hov != null && hov !== i ? ' is-dim' : '')} onMouseEnter={() => { setHov(i); onHighlight && onHighlight(i); }} onMouseLeave={() => setHov(null)}>
                <div className="hn-bars__up" style={{ height: half + '%' }}><span style={{ height: ((d.up || 0) / max) * 100 + '%' }} /></div>
                {hasDown ? <div className="hn-bars__down" style={{ height: half + '%' }}><span style={{ height: ((d.down || 0) / max) * 100 + '%' }} /></div> : null}
                {active === i ? (
                  <div className="hn-bars__tip">
                    <strong>{d.label}</strong>
                    <div><em>{series[0]}</em><b className="hn-num">{format(d.up || 0)}</b></div>
                    {hasDown ? <div><em>{series[1]}</em><b className="hn-num">{format(d.down || 0)}</b></div> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hn-bars__x">{data.map((d, i) => <span key={i}>{d.label}</span>)}</div>
    </div>
  );
}
