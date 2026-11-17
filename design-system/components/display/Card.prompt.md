Base surface for every dashboard widget — white tile with hairline border; title row + actions on top.

```jsx
<Card title="Receita" subtitle="Últimos 12 meses" actions={<Select variant="pill" size="sm" options={['Este ano']} />}>
  …
</Card>
<Card variant="brand">Hero KPI</Card>
```

- `sunken` for tiles nested inside a card (mini KPIs, composer). Never nest white-on-white.
- `brand` (violet) at most once per screen — the hero KPI.
