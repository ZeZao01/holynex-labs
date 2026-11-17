import React from 'react';
import { Checkbox } from '../forms/Checkbox.jsx';
import { Icon } from '../core/Icon.jsx';
export function DataTable({ columns = [], rows = [], rowKey = 'id', selectable, selected = [], onSelectChange, sort, onSortChange, onRowClick, empty = 'Nenhum registro encontrado', density = 'md', className }) {
  const key = (r, i) => (typeof rowKey === 'function' ? rowKey(r) : r[rowKey]) ?? i;
  const all = rows.length > 0 && rows.every((r, i) => selected.includes(key(r, i)));
  const some = !all && rows.some((r, i) => selected.includes(key(r, i)));
  const toggleAll = () => onSelectChange && onSelectChange(all ? [] : rows.map(key));
  const toggle = (k) => onSelectChange && onSelectChange(selected.includes(k) ? selected.filter((x) => x !== k) : selected.concat(k));
  const cell = (c, r) => (c.render ? c.render(r) : r[c.key]);
  const primary = columns.find((c) => c.primary) || columns[0];
  const trailing = columns.find((c) => c.trailing);
  const rest = columns.filter((c) => c !== primary && c !== trailing && !c.hideOnMobile);
  const clickSort = (c) => { if (!c.sortable || !onSortChange) return; const dir = sort && sort.key === c.key && sort.dir === 'asc' ? 'desc' : 'asc'; onSortChange({ key: c.key, dir }); };
  return (
    <div className={['hn-table-wrap', 'hn-table--' + density, className].filter(Boolean).join(' ')}>
      <div className="hn-table-scroll">
        <table className="hn-table">
          <thead><tr>
            {selectable ? <th className="hn-table__sel"><Checkbox checked={all} indeterminate={some} onChange={toggleAll} aria-label="Selecionar todos" /></th> : null}
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align || 'left' }} className={c.sortable ? 'is-sortable' : undefined} onClick={() => clickSort(c)} aria-sort={sort && sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <span className="hn-th">{c.header}{c.sortable ? <Icon name={sort && sort.key === c.key ? (sort.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'} size={12} /> : null}</span>
              </th>
            ))}
          </tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="hn-table__empty">{empty}</td></tr> : rows.map((r, i) => {
              const k = key(r, i);
              const isSel = selected.includes(k);
              return (
                <tr key={k} className={(isSel ? 'is-selected ' : '') + (onRowClick ? 'is-clickable' : '')} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                  {selectable ? <td className="hn-table__sel" onClick={(e) => e.stopPropagation()}><Checkbox checked={isSel} onChange={() => toggle(k)} aria-label="Selecionar linha" /></td> : null}
                  {columns.map((c) => <td key={c.key} style={{ textAlign: c.align || 'left' }}>{cell(c, r)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="hn-tlist">
        {rows.length === 0 ? <li className="hn-table__empty">{empty}</li> : rows.map((r, i) => {
          const k = key(r, i);
          return (
            <li key={k} className={'hn-tlist__item' + (onRowClick ? ' is-clickable' : '')} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              <div className="hn-tlist__head">
                {selectable ? <span onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.includes(k)} onChange={() => toggle(k)} aria-label="Selecionar" /></span> : null}
                <div className="hn-tlist__primary">{cell(primary, r)}</div>
                {trailing ? <div className="hn-tlist__trail">{cell(trailing, r)}</div> : null}
              </div>
              {rest.length ? <dl className="hn-tlist__meta">{rest.map((c) => <div key={c.key}><dt>{c.header}</dt><dd>{cell(c, r)}</dd></div>)}</dl> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
