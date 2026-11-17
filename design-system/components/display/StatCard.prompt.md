KPI tile. Use `default` inside a Card (grey sunken), `card` standalone, `brand` for the one hero number.

```jsx
<StatCard icon="banknote" label="Receita" value="R$ 148.420" delta={12.4} footnote="vs. mês anterior" />
<StatCard variant="brand" label="Receita recorrente (MRR)" value="R$ 86.240" unit="BRL" delta="+8,1%">
  <div style={{display:'flex',gap:8}}><Button variant="secondary" size="sm">Relatório</Button></div>
</StatCard>
```
