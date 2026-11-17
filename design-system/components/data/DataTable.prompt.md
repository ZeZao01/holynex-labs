The admin list view — sortable, selectable, and automatically card-stacked on narrow containers (phones, narrow columns).

```jsx
<DataTable selectable selected={sel} onSelectChange={setSel} sort={sort} onSortChange={setSort}
  columns={[
    {key:'name', header:'Cliente', primary:true, render:r=><b>{r.name}</b>},
    {key:'plan', header:'Plano'},
    {key:'mrr', header:'MRR', align:'right', sortable:true, render:r=><span className="hn-num">{r.mrr}</span>},
    {key:'status', header:'Status', trailing:true, render:r=><Badge tone="success">{r.status}</Badge>},
  ]}
  rows={rows} />
```

- Wrap in `<Card padding="none">` or a Card with the table flush; header row is a grey rounded strip.
- Mark the money/status column `trailing` so it stays visible on mobile.
